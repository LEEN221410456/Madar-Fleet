package edu.se411.madarfleet.vehicle;

import java.util.List;
import org.springframework.data.domain.Page;

public record VehiclePage(List<VehicleResponse> items, int page, int size, long totalElements,
        int totalPages, boolean hasNext, boolean hasPrevious) {
    static VehiclePage from(Page<Vehicle> source) {
        return new VehiclePage(source.getContent().stream().map(Vehicle::response).toList(),
                source.getNumber(), source.getSize(), source.getTotalElements(),
                source.getTotalPages(), source.hasNext(), source.hasPrevious());
    }
}
