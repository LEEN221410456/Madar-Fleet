package edu.se411.madarfleet.vehicle;

import jakarta.validation.Valid;
import java.net.URI;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/vehicles")
class VehicleController {
    private final VehicleService service;

    VehicleController(VehicleService service) {
        this.service = service;
    }

    @PostMapping
    ResponseEntity<VehicleResponse> create(@Valid @RequestBody VehicleRequest request) {
        VehicleResponse created = service.create(request);
        return ResponseEntity.created(URI.create("/api/vehicles/" + created.id())).body(created);
    }

    @GetMapping("/{id}")
    VehicleResponse find(@PathVariable("id") String id) {
        return service.find(id);
    }

    @GetMapping
    VehiclePage list(@RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "5") int size,
            @RequestParam(name = "q", defaultValue = "") String query,
            @RequestParam(name = "branch", defaultValue = "") String branch,
            @RequestParam(name = "status", defaultValue = "") String status,
            @RequestParam(name = "serviceOnly", defaultValue = "false") boolean serviceOnly,
            @RequestParam(name = "sort", defaultValue = "id") String sort) {
        return service.list(page, size, new VehicleQuery(query, branch, status, serviceOnly, sort));
    }

    @GetMapping("/summary")
    VehicleSummary summary() {
        return service.summary();
    }

    @DeleteMapping("/{id}")
    ResponseEntity<Void> archive(@PathVariable("id") String id) {
        service.archive(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/restore")
    VehicleResponse restore(@PathVariable("id") String id) {
        return service.restore(id);
    }

    @PutMapping("/{id}")
    VehicleResponse update(@PathVariable("id") String id, @Valid @RequestBody VehicleRequest request) {
        return service.update(id, request);
    }
}
