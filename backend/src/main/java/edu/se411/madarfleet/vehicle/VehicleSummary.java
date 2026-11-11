package edu.se411.madarfleet.vehicle;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record VehicleSummary(long total, long available, long assigned, long maintenance,
        long service, BigDecimal value, long utilization) {
    static VehicleSummary from(List<Vehicle> fleet, LocalDate today) {
        long available = 0, assigned = 0, maintenance = 0, service = 0, active = 0;
        BigDecimal value = BigDecimal.ZERO;
        LocalDate cutoff = today.plusDays(14);
        for (Vehicle vehicle : fleet) {
            String status = vehicle.status();
            if ("Retired".equals(status)) continue;
            active++;
            value = value.add(vehicle.value());
            if ("Available".equals(status)) available++;
            if ("Assigned".equals(status)) assigned++;
            if ("Maintenance".equals(status)) maintenance++;
            if ("Maintenance".equals(status) ||
                    (vehicle.serviceDate() != null && !vehicle.serviceDate().isAfter(cutoff))) {
                service++;
            }
        }
        return new VehicleSummary(fleet.size(), available, assigned, maintenance, service,
                value, active == 0 ? 0 : Math.round(assigned * 100.0 / active));
    }
}
