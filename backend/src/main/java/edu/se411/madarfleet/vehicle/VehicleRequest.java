package edu.se411.madarfleet.vehicle;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record VehicleRequest(
        @NotBlank @Size(max = 80) String make,
        @NotBlank @Size(max = 80) String model,
        @NotNull @Min(1990) Integer year,
        @NotBlank @Size(max = 40) String plate,
        @NotBlank @Size(max = 40) String branch,
        @NotBlank @Size(max = 20) String status,
        @Size(max = 120) String driver,
        @NotNull @PositiveOrZero @Max(9_007_199_254_740_991L) Long mileage,
        @NotNull @PositiveOrZero @DecimalMax("100000000.00")
        @Digits(integer = 9, fraction = 2) BigDecimal value,
        @Size(max = 10) String serviceDate,
        @Size(max = 500) String notes
) {}
