package edu.se411.madarfleet.vehicle;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class VehicleServiceTest {
    private static final Clock CLOCK = Clock.fixed(Instant.parse("2026-11-11T10:00:00Z"), ZoneOffset.UTC);

    @Mock
    private VehicleRepository repository;
    private VehicleService service;

    @BeforeEach
    void createService() {
        service = new VehicleService(repository, CLOCK);
    }

    @Test
    void createUsesTheRepositoryGeneratedIdAndNormalizesTheRecord() {
        when(repository.saveAndFlush(any(Vehicle.class))).thenAnswer(call -> {
            Vehicle saved = call.getArgument(0);
            ReflectionTestUtils.setField(saved, "id", 9L);
            return saved;
        });

        VehicleResponse created = service.create(request("  new   4821 ", "Available", "Old driver"));

        assertThat(created.id()).isEqualTo("MF-009");
        assertThat(created.make()).isEqualTo("Toyota");
        assertThat(created.plate()).isEqualTo("NEW 4821");
        assertThat(created.driver()).isEmpty();
        assertThat(created.value()).isEqualByComparingTo("97000.50");
        verify(repository).existsByPlateKey("NEW4821");
    }

    @Test
    void createRejectsEquivalentRegistrationWithoutWriting() {
        when(repository.existsByPlateKey("RKD4821")).thenReturn(true);

        assertThatThrownBy(() -> service.create(request("ＲＫＤ- 4821", "Available", "")))
                .isInstanceOfSatisfying(FleetException.class, ex -> {
                    assertThat(ex.status()).isEqualTo(HttpStatus.CONFLICT);
                    assertThat(ex.code()).isEqualTo("DUPLICATE_PLATE");
                    assertThat(ex.fieldErrors()).containsKey("plate");
                });
        verify(repository, never()).saveAndFlush(any(Vehicle.class));
    }

    @Test
    void findUsesThePublicId() {
        when(repository.findById(1L)).thenReturn(Optional.of(stored(1, "RKD 4821")));

        assertThat(service.find(" mf-001 ").id()).isEqualTo("MF-001");
    }

    @Test
    void unknownIdReturnsNotFound() {
        when(repository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.find("MF-999"))
                .isInstanceOfSatisfying(FleetException.class,
                        ex -> assertThat(ex.status()).isEqualTo(HttpStatus.NOT_FOUND));
    }

    @ParameterizedTest
    @ValueSource(strings = {"001", "MF-000", "MF-0001", "MF-9999999999999999999"})
    void invalidIdDoesNotQueryTheRepository(String id) {
        assertThatThrownBy(() -> service.find(id))
                .isInstanceOfSatisfying(FleetException.class,
                        ex -> assertThat(ex.fieldErrors()).containsKey("id"));
        verifyNoInteractions(repository);
    }

    @Test
    void listPassesStableNumericSortingAndMapsPageMetadata() {
        PageRequest page = PageRequest.of(1, 3, Sort.by("id"));
        when(repository.findAll(any(Specification.class), eq(page))).thenReturn(new PageImpl<>(List.of(
                stored(4, "RYD 2587"), stored(5, "KBR 6039"), stored(6, "JDH 1478")), page, 8));

        VehiclePage response = service.list(1, 3);

        assertThat(response.items()).extracting(VehicleResponse::id)
                .containsExactly("MF-004", "MF-005", "MF-006");
        assertThat(response.page()).isEqualTo(1);
        assertThat(response.size()).isEqualTo(3);
        assertThat(response.totalElements()).isEqualTo(8);
        assertThat(response.totalPages()).isEqualTo(3);
        assertThat(response.hasNext()).isTrue();
        assertThat(response.hasPrevious()).isTrue();
        verify(repository).findAll(any(Specification.class), eq(page));
    }

    @ParameterizedTest
    @CsvSource({"-1, 5, page", "0, 0, size", "0, 101, size", "2147483647, 100, page"})
    void invalidPaginationDoesNotQueryTheRepository(int page, int size, String field) {
        assertThatThrownBy(() -> service.list(page, size))
                .isInstanceOfSatisfying(FleetException.class,
                        ex -> assertThat(ex.fieldErrors()).containsKey(field));
        verifyNoInteractions(repository);
    }

    @Test
    void updateCanKeepAnEquivalentRegistrationWithoutChangingTheId() {
        Vehicle existing = stored(1, "RKD 4821");
        when(repository.findById(1L)).thenReturn(Optional.of(existing));
        when(repository.saveAndFlush(existing)).thenReturn(existing);

        VehicleResponse updated = service.update("MF-001", request("rkd-4821", "Assigned", " Demo Driver "));

        assertThat(updated.id()).isEqualTo("MF-001");
        assertThat(updated.status()).isEqualTo("Assigned");
        assertThat(updated.driver()).isEqualTo("Demo Driver");
        assertThat(updated.mileage()).isEqualTo(12_000);
        verify(repository, never()).existsByPlateKey(any());
    }

    @Test
    void updateRejectsRegistrationOwnedByAnotherRecordWithoutMutatingExistingRecord() {
        Vehicle existing = stored(1, "RKD 4821");
        when(repository.findById(1L)).thenReturn(Optional.of(existing));
        when(repository.existsByPlateKey("JHD7352")).thenReturn(true);

        assertThatThrownBy(() -> service.update("MF-001", request("JHD 7352", "Available", "")))
                .isInstanceOfSatisfying(FleetException.class,
                        ex -> assertThat(ex.status()).isEqualTo(HttpStatus.CONFLICT));
        assertThat(existing.response().plate()).isEqualTo("RKD 4821");
        verify(repository, never()).saveAndFlush(any(Vehicle.class));
    }

    @Test
    void assignedVehicleWithoutDriverIsRejectedBeforeAnyStorageCall() {
        assertThatThrownBy(() -> service.create(request("NEW 1234", "Assigned", " ")))
                .isInstanceOfSatisfying(FleetException.class,
                        ex -> assertThat(ex.fieldErrors()).containsKey("driver"));
        verifyNoInteractions(repository);
    }

    private static Vehicle stored(long id, String plate) {
        Vehicle vehicle = new Vehicle();
        vehicle.apply(VehicleRules.validateAndNormalize(request(plate, "Available", ""), CLOCK));
        ReflectionTestUtils.setField(vehicle, "id", id);
        return vehicle;
    }

    private static VehicleRequest request(String plate, String status, String driver) {
        return new VehicleRequest(" Toyota ", "Camry", 2025, plate, "Riyadh", status, driver,
                12_000L, new BigDecimal("97000.50"), "", "");
    }
}
