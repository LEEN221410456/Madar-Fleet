package edu.se411.madarfleet.vehicle;

import java.util.Locale;
import java.util.Map;
import java.util.regex.Pattern;

final class VehicleIds {
    private static final Pattern ASSET_ID = Pattern.compile("MF-[0-9]{3,19}");
    private static final String INVALID_ID = "Enter a vehicle ID such as MF-001.";

    private VehicleIds() {}

    static String format(long key) {
        return String.format(Locale.ROOT, "MF-%03d", key);
    }

    static long parse(String input) {
        String id = input.strip().toUpperCase(Locale.ROOT);
        if (ASSET_ID.matcher(id).matches()) {
            try {
                long key = Long.parseLong(id.substring(3));
                if (key > 0 && format(key).equals(id)) {
                    return key;
                }
            } catch (NumberFormatException ignored) {
                // The numeric portion exceeded the range of a database ID.
            }
        }
        throw FleetException.invalid(Map.of("id", INVALID_ID));
    }
}
