package edu.se411.madarfleet.vehicle;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

class VehicleRulesTest {
    private static final Clock CLOCK = Clock.fixed(Instant.parse("2026-12-31T22:00:00Z"),
            ZoneId.of("Asia/Riyadh"));

    @Test
    void yearBoundaryUsesTheSaudiCalendarAndAcceptsTheNextModelYear() {
        VehicleDetails result = VehicleRules.validateAndNormalize(
                request(2028, "Al Khobar", "Available", "QA 101", "2028-02-29"), CLOCK);
        assertThat(result.year()).isEqualTo(2028);
        assertThat(result.serviceDate()).isEqualTo(LocalDate.of(2028, 2, 29));
    }

    @Test
    void reportsIndependentBusinessRuleErrorsTogether() {
        assertThatThrownBy(() -> VehicleRules.validateAndNormalize(
                request(2029, "Unknown", "In storage", " - ", "2026-02-30"), CLOCK))
                .isInstanceOfSatisfying(FleetException.class, ex -> assertThat(ex.fieldErrors())
                        .containsOnlyKeys("year", "branch", "status", "plate", "serviceDate"));
    }

    @ParameterizedTest
    @ValueSource(strings = {"2026-02-29", "2026-04-31", "2026/11/11", "2026-1-01"})
    void rejectsInvalidCalendarDatesAndFormats(String date) {
        assertThatThrownBy(() -> VehicleRules.validateAndNormalize(
                request(2026, "Riyadh", "Available", "QA 101", date), CLOCK))
                .isInstanceOfSatisfying(FleetException.class,
                        ex -> assertThat(ex.fieldErrors()).containsOnlyKeys("serviceDate"));
    }

    @Test
    void keepsArabicRegistrationAndHandlesAbsentOptionalFields() {
        VehicleDetails result = VehicleRules.validateAndNormalize(
                request(2026, "Dammam", "Maintenance", "أ ب ج-1234", null), CLOCK);
        assertThat(result.plateKey()).isEqualTo("أبج1234");
        assertThat(result.serviceDate()).isNull();
        assertThat(result.notes()).isEmpty();
        assertThat(result.driver()).isEmpty();
    }

    private static VehicleRequest request(int year, String branch, String status, String plate, String date) {
        return new VehicleRequest("Kia", "K5", year, plate, branch, status, null, 0L,
                BigDecimal.ZERO, date, null);
    }
}
