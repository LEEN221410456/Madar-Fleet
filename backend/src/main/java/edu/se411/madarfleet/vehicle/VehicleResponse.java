package edu.se411.madarfleet.vehicle;

import java.math.BigDecimal;

public record VehicleResponse(String id, String make, String model, int year, String plate,
        String branch, String status, String driver, long mileage, BigDecimal value,
        String serviceDate, String notes) {}
