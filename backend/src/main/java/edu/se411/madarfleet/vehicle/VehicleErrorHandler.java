package edu.se411.madarfleet.vehicle;

import java.sql.SQLException;
import java.util.LinkedHashMap;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

@RestControllerAdvice(assignableTypes = VehicleController.class)
class VehicleErrorHandler {
    private static final Logger LOG = LoggerFactory.getLogger(VehicleErrorHandler.class);

    @ExceptionHandler(FleetException.class)
    ResponseEntity<ApiError> applicationError(FleetException error) {
        return ResponseEntity.status(error.status())
                .body(new ApiError(error.code(), error.getMessage(), error.fieldErrors()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ApiError> invalidFields(MethodArgumentNotValidException error) {
        Map<String, String> fields = new LinkedHashMap<>();
        error.getBindingResult().getFieldErrors().forEach(field ->
                fields.putIfAbsent(field.getField(), field.getDefaultMessage()));
        return applicationError(FleetException.invalid(fields));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    ResponseEntity<ApiError> invalidBody() {
        return ResponseEntity.badRequest().body(new ApiError("INVALID_BODY",
                "Send valid JSON with the expected field types.", Map.of()));
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    ResponseEntity<ApiError> invalidParameter(MethodArgumentTypeMismatchException error) {
        return applicationError(FleetException.invalid(
                Map.of(error.getName(), "serviceOnly".equals(error.getName())
                        ? "Enter true or false." : "Enter a whole number.")));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    ResponseEntity<ApiError> databaseConstraint(DataIntegrityViolationException error) {
        // Handles a concurrent duplicate after both requests passed the initial lookup.
        // The only user-controlled unique key is the normalized registration.
        for (Throwable cause = error; cause != null; cause = cause.getCause()) {
            if (cause instanceof SQLException sql && "23505".equals(sql.getSQLState())) {
                return applicationError(FleetException.duplicatePlate());
            }
        }
        LOG.error("Could not save a vehicle because of a database constraint", error);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiError("STORAGE_ERROR", "The vehicle could not be saved.", Map.of()));
    }
}

record ApiError(String code, String message, Map<String, String> fieldErrors) {}
