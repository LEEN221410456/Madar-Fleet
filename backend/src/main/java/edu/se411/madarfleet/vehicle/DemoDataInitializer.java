package edu.se411.madarfleet.vehicle;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.util.List;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@ConditionalOnProperty(name = "madar.seed-demo-data", havingValue = "true")
class DemoDataInitializer implements ApplicationRunner {
    private final VehicleRepository repository;
    private final VehicleService service;
    private final Clock clock;

    DemoDataInitializer(VehicleRepository repository, VehicleService service, Clock clock) {
        this.repository = repository;
        this.service = service;
        this.clock = clock;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (repository.count() != 0) {
            return;
        }
        LocalDate today = LocalDate.now(clock);
        List<VehicleRequest> seed = List.of(
                sample("Toyota", "Camry", 2025, "RKD 4821", "Riyadh", "Assigned", "Faisal Alotaibi",
                        18420, 112000, today.plusDays(38), "Executive operations vehicle."),
                sample("Hyundai", "Sonata", 2024, "JHD 7352", "Jeddah", "Available", "",
                        24180, 98000, today.plusDays(24), "Ready for branch assignment."),
                sample("Toyota", "Hilux", 2024, "DMM 9164", "Dammam", "Maintenance", "",
                        45200, 126000, today.minusDays(2), "Scheduled brake inspection."),
                sample("Nissan", "Altima", 2025, "RYD 2587", "Riyadh", "Assigned", "Noura Alharbi",
                        12750, 108000, today.plusDays(6), "Regional sales team."),
                sample("Kia", "K5", 2025, "KBR 6039", "Al Khobar", "Available", "",
                        8400, 105000, today.plusDays(52), ""),
                sample("Toyota", "Corolla", 2023, "JDH 1478", "Jeddah", "Assigned", "Omar Alghamdi",
                        57320, 78000, today.plusDays(12), "Airport coordination vehicle."),
                sample("Hyundai", "Tucson", 2024, "RYH 8206", "Riyadh", "Available", "",
                        21980, 118000, today.plusDays(45), ""),
                sample("Nissan", "Patrol", 2022, "DHM 3945", "Dammam", "Retired", "",
                        146800, 165000, null, "Retained for asset history; no longer operational.")
        );
        seed.forEach(service::create);
    }

    private static VehicleRequest sample(String make, String model, int year, String plate,
            String branch, String status, String driver, long mileage, long value,
            LocalDate date, String notes) {
        return new VehicleRequest(make, model, year, plate, branch, status, driver, mileage,
                BigDecimal.valueOf(value), date == null ? "" : date.toString(), notes);
    }
}
