package edu.se411.madarfleet.vehicle;

import java.util.Map;
import org.springframework.http.HttpStatus;

final class FleetException extends RuntimeException {
    private final HttpStatus status;
    private final String code;
    private final Map<String, String> fieldErrors;

    private FleetException(HttpStatus status, String code, String message, Map<String, String> fieldErrors) {
        super(message);
        this.status = status;
        this.code = code;
        this.fieldErrors = Map.copyOf(fieldErrors);
    }

    static FleetException invalid(Map<String, String> fields) {
        return new FleetException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR",
                "Correct the highlighted fields.", fields);
    }

    static FleetException notFound(long key) {
        return new FleetException(HttpStatus.NOT_FOUND, "VEHICLE_NOT_FOUND",
                "No vehicle was found with ID " + VehicleIds.format(key) + ".", Map.of());
    }

    static FleetException duplicatePlate() {
        return new FleetException(HttpStatus.CONFLICT, "DUPLICATE_PLATE",
                "This registration number is already in use.",
                Map.of("plate", "Use a registration number that is not already in the fleet."));
    }

    HttpStatus status() { return status; }
    String code() { return code; }
    Map<String, String> fieldErrors() { return fieldErrors; }
}
