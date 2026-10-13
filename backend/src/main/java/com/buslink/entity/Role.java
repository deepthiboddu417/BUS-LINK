package com.buslink.entity;

import com.fasterxml.jackson.annotation.JsonCreator;

public enum Role {
    ROLE_ADMIN,
    ROLE_STUDENT,
    ROLE_PARENT,
    ROLE_DRIVER;

    @JsonCreator
    public static Role fromString(String value) {
        if (value == null || value.trim().isEmpty()) {
            return ROLE_STUDENT;
        }
        String cleanValue = value.trim().toUpperCase();
        if (!cleanValue.startsWith("ROLE_")) {
            cleanValue = "ROLE_" + cleanValue;
        }
        for (Role role : Role.values()) {
            if (role.name().equalsIgnoreCase(cleanValue)) {
                return role;
            }
        }
        return ROLE_STUDENT;
    }
}
