package edu.se411.madarfleet.vehicle;

import java.time.Clock;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
class VehicleService {
    private final VehicleRepository repository;
    private final Clock clock;

    VehicleService(VehicleRepository repository, Clock clock) {
        this.repository = repository;
        this.clock = clock;
    }

    @Transactional
    public VehicleResponse create(VehicleRequest request) {
        VehicleDetails details = VehicleRules.validateAndNormalize(request, clock);
        requireUnusedPlate(details.plateKey());
        Vehicle vehicle = new Vehicle();
        vehicle.apply(details);
        return repository.saveAndFlush(vehicle).response();
    }

    @Transactional(readOnly = true)
    public VehicleResponse find(String id) {
        return requireVehicle(id).response();
    }

    @Transactional(readOnly = true)
    public VehiclePage list(int page, int size) {
        return list(page, size, new VehicleQuery("", "", "", false, "id"));
    }

    @Transactional(readOnly = true)
    public VehiclePage list(int page, int size, VehicleQuery query) {
        Map<String, String> errors = new LinkedHashMap<>();
        if (page < 0) {
            errors.put("page", "Page must be zero or greater.");
        }
        if (size < 1 || size > 100) {
            errors.put("size", "Page size must be between 1 and 100.");
        } else if ((long) page * size > Integer.MAX_VALUE) {
            errors.put("page", "The requested page offset is too large.");
        }
        if (!errors.isEmpty()) {
            throw FleetException.invalid(errors);
        }
        return VehiclePage.from(repository.findAll(query.specification(LocalDate.now(clock)),
                PageRequest.of(page, size, query.order())));
    }

    @Transactional
    public VehicleResponse update(String id, VehicleRequest request) {
        Vehicle vehicle = requireVehicle(id);
        VehicleDetails details = VehicleRules.validateAndNormalize(request, clock);
        if (!details.plateKey().equals(vehicle.plateKey())) {
            requireUnusedPlate(details.plateKey());
        }
        vehicle.apply(details);
        return repository.saveAndFlush(vehicle).response();
    }

    @Transactional(readOnly = true)
    public VehicleSummary summary() {
        return VehicleSummary.from(repository.findAll(VehicleQuery.active()), LocalDate.now(clock));
    }

    @Transactional
    public void archive(String id) {
        requireVehicle(id).archive();
    }

    @Transactional
    public VehicleResponse restore(String id) {
        Vehicle vehicle = loadVehicle(VehicleIds.parse(id));
        vehicle.restore();
        return vehicle.response();
    }

    private Vehicle requireVehicle(String id) {
        long key = VehicleIds.parse(id);
        Vehicle vehicle = loadVehicle(key);
        if (vehicle.isArchived()) {
            throw FleetException.notFound(key);
        }
        return vehicle;
    }

    private Vehicle loadVehicle(long key) {
        return repository.findById(key).orElseThrow(() -> FleetException.notFound(key));
    }

    private void requireUnusedPlate(String plateKey) {
        if (repository.existsByPlateKey(plateKey)) {
            throw FleetException.duplicatePlate();
        }
    }
}
