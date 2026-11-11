package edu.se411.madarfleet.vehicle;

import java.text.Normalizer;
import java.time.Clock;
import java.time.LocalDate;
import java.time.Year;
import java.time.format.DateTimeParseException;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

final class VehicleRules {
    static final Set<String> BRANCHES = Set.of("Riyadh", "Jeddah", "Dammam", "Al Khobar");
    static final Set<String> STATUSES = Set.of("Available", "Assigned", "Maintenance", "Retired");
    private static final Pattern SPACE = Pattern.compile("\\s+", Pattern.UNICODE_CHARACTER_CLASS);
    private static final Pattern PLATE_SEPARATORS =
            Pattern.compile("[\\s-]+", Pattern.UNICODE_CHARACTER_CLASS);
    private static final Pattern ISO_DATE = Pattern.compile("[0-9]{4}-[0-9]{2}-[0-9]{2}");

    private VehicleRules() {}

    static VehicleDetails validateAndNormalize(VehicleRequest request, Clock clock) {
        Map<String, String> errors = new LinkedHashMap<>();
        String branch = request.branch().strip();
        String status = request.status().strip();
        String plate = SPACE.matcher(request.plate()).replaceAll(" ").strip().toUpperCase(Locale.ROOT);
        String plateKey = PLATE_SEPARATORS
                .matcher(Normalizer.normalize(request.plate(), Normalizer.Form.NFKC))
                .replaceAll("").toUpperCase(Locale.ROOT);
        String driver = optional(request.driver());
        LocalDate serviceDate = null;

        if (!BRANCHES.contains(branch)) {
            errors.put("branch", "Choose Riyadh, Jeddah, Dammam, or Al Khobar.");
        }
        if (!STATUSES.contains(status)) {
            errors.put("status", "Choose Available, Assigned, Maintenance, or Retired.");
        }
        if (plateKey.isEmpty()) {
            errors.put("plate", "Enter a registration number, not only separators.");
        }
        int maxYear = Year.now(clock).getValue() + 1;
        if (request.year() > maxYear) {
            errors.put("year", "Use a year from 1990 to " + maxYear + ".");
        }
        if ("Assigned".equals(status) && driver.isEmpty()) {
            errors.put("driver", "An assigned vehicle needs a driver.");
        }
        String date = optional(request.serviceDate());
        if (!date.isEmpty()) {
            try {
                if (!ISO_DATE.matcher(date).matches()) {
                    throw new DateTimeParseException("Expected YYYY-MM-DD", date, 0);
                }
                serviceDate = LocalDate.parse(date);
            } catch (DateTimeParseException invalidDate) {
                errors.put("serviceDate", "Use a valid date in YYYY-MM-DD format.");
            }
        }
        if (!errors.isEmpty()) {
            throw FleetException.invalid(errors);
        }
        return new VehicleDetails(request.make().strip(), request.model().strip(), request.year(),
                plate, plateKey, branch, status, "Assigned".equals(status) ? driver : "",
                request.mileage(), request.value(), serviceDate, optional(request.notes()));
    }

    private static String optional(String value) {
        return value == null ? "" : value.strip();
    }
}
