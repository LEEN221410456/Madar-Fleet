package edu.se411.madarfleet.vehicle;

import jakarta.persistence.criteria.Predicate;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;

record VehicleQuery(String query, String branch, String status, boolean serviceOnly, String sort) {
    VehicleQuery {
        query = query.strip();
        Map<String, String> errors = new LinkedHashMap<>();
        if (query.length() > 120) errors.put("q", "Use 120 characters or fewer.");
        if (!branch.isEmpty() && !VehicleRules.BRANCHES.contains(branch)) {
            errors.put("branch", "Choose a valid branch.");
        }
        if (!status.isEmpty() && !VehicleRules.STATUSES.contains(status)) {
            errors.put("status", "Choose a valid status.");
        }
        if (!Set.of("id", "model", "mileage", "service").contains(sort)) {
            errors.put("sort", "Choose id, model, mileage, or service.");
        }
        if (!errors.isEmpty()) throw FleetException.invalid(errors);
    }

    static Specification<Vehicle> active() {
        return (root, query, cb) -> cb.or(cb.isNull(root.get("archived")), cb.isFalse(root.get("archived")));
    }

    Sort order() {
        return switch (sort) {
            case "model" -> Sort.by(Sort.Order.asc("make").ignoreCase(),
                    Sort.Order.asc("model").ignoreCase(), Sort.Order.asc("id"));
            case "mileage" -> Sort.by(Sort.Order.desc("mileage"), Sort.Order.asc("id"));
            case "service" -> Sort.unsorted(); // Date ordering, including null placement, is set in the query.
            default -> Sort.by("id");
        };
    }

    Specification<Vehicle> specification(LocalDate today) {
        String term = query.toLowerCase(Locale.ROOT);
        String escaped = "%" + term.replace("!", "!!").replace("%", "!%").replace("_", "!_") + "%";
        Long assetId = exactId(term);
        return (root, criteria, cb) -> {
            var conditions = new ArrayList<Predicate>();
            conditions.add(active().toPredicate(root, criteria, cb));
            if (!term.isEmpty()) {
                var matches = new ArrayList<Predicate>();
                for (String field : new String[] {"make", "model", "plate", "driver", "branch"}) {
                    matches.add(cb.like(cb.lower(root.get(field)), escaped, '!'));
                }
                matches.add(cb.like(cb.lower(cb.concat(cb.concat(root.get("make"), " "), root.get("model"))),
                        escaped, '!'));
                if (assetId != null) matches.add(cb.equal(root.get("id"), assetId));
                conditions.add(cb.or(matches.toArray(Predicate[]::new)));
            }
            if (!branch.isEmpty()) conditions.add(cb.equal(root.get("branch"), branch));
            if (!status.isEmpty()) conditions.add(cb.equal(root.get("status"), status));
            if (serviceOnly) {
                conditions.add(cb.notEqual(root.get("status"), "Retired"));
                conditions.add(cb.or(cb.equal(root.get("status"), "Maintenance"),
                        cb.lessThanOrEqualTo(root.<LocalDate>get("serviceDate"), today.plusDays(14))));
            }
            if (sort.equals("service") && criteria != null && criteria.getResultType() == Vehicle.class) {
                var date = root.<LocalDate>get("serviceDate");
                criteria.orderBy(cb.asc(cb.<Integer>selectCase().when(cb.isNull(date), 1).otherwise(0)),
                        cb.asc(date), cb.asc(root.get("id")));
            }
            return cb.and(conditions.toArray(Predicate[]::new));
        };
    }

    private static Long exactId(String term) {
        if (!term.startsWith("mf-")) return null;
        try {
            return VehicleIds.parse(term);
        } catch (FleetException invalidId) {
            return null;
        }
    }
}
