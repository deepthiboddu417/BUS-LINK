package com.buslink.config;

import com.buslink.entity.*;
import com.buslink.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Component
public class DataSeeder implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private ParentRepository parentRepository;

    @Autowired
    private DriverRepository driverRepository;

    @Autowired
    private BusRepository busRepository;

    @Autowired
    private RouteRepository routeRepository;

    @Autowired
    private GeofenceRepository geofenceRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @org.springframework.beans.factory.annotation.Value("${app.admin.email:admin@buslink.com}")
    private String configuredAdminEmail;

    @org.springframework.beans.factory.annotation.Value("${app.admin.password:Admin@123}")
    private String configuredAdminPassword;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        userRepository.findByEmail("student@buslink.com").ifPresent(studentUser -> {
            if ("Rahul Kumar".equalsIgnoreCase(studentUser.getName())) {
                studentUser.setName("Veeru");
                userRepository.save(studentUser);
            }
        });

        // 1. Create or ensure Admin account exists (never overwrites existing passwords or duplicates)
        String adminEmail = (configuredAdminEmail != null && !configuredAdminEmail.trim().isEmpty())
                ? configuredAdminEmail.trim().toLowerCase() : "admin@buslink.com";
        String adminPassword = (configuredAdminPassword != null && !configuredAdminPassword.trim().isEmpty())
                ? configuredAdminPassword.trim() : "Admin@123";

        if (!userRepository.existsByEmail(adminEmail)) {
            User adminUser = new User(
                adminEmail,
                passwordEncoder.encode(adminPassword),
                "System Administrator",
                "9876543210",
                Role.ROLE_ADMIN
            );
            userRepository.save(adminUser);
            System.out.println(">>> Seeded new Admin account: " + adminEmail);
        }

        if (busRepository.count() > 0) {
            return; // Demo fleet data already seeded
        }

        // 2. Create Parents
        User parentUser1 = new User("parent@buslink.com", passwordEncoder.encode("Parent@123"), "Suresh Kumar", "9848022334", Role.ROLE_PARENT);
        Parent parent1 = parentRepository.save(new Parent(parentUser1, "Door No 4-12, Main Road, Karedu"));

        User parentUser2 = new User("jagadeesh@buslink.com", passwordEncoder.encode("Parent@123"), "E.jagadeesh", "9848022335", Role.ROLE_PARENT);
        Parent parent2 = parentRepository.save(new Parent(parentUser2, "Door No 12-5, Trunk Road, Kandukur"));

        User parentUser3 = new User("sridhar@buslink.com", passwordEncoder.encode("Parent@123"), "B.sridhar", "9848022336", Role.ROLE_PARENT);
        Parent parent3 = parentRepository.save(new Parent(parentUser3, "Door No 8-44, Lawyerpet, Ongole"));

        User parentUser4 = new User("sunil@buslink.com", passwordEncoder.encode("Parent@123"), "P.Sunil", "9848022337", Role.ROLE_PARENT);
        Parent parent4 = parentRepository.save(new Parent(parentUser4, "Door No 3-19, Market Center, Kandukur"));

        // 3. Create Driver (Ramesh Driver)
        User driverUser = new User("driver@buslink.com", passwordEncoder.encode("Driver@123"), "Ramesh Driver", "9440112233", Role.ROLE_DRIVER);
        Driver driver = new Driver(driverUser, "DL-AP-2024-8899");
        driver = driverRepository.save(driver);

        // 4. Create Route (Karedu -> Kandukur -> Ongole -> College)
        Route route = new Route("Karedu → Kandukur → Ongole → College", "Karedu", "College");
        
        RouteStop s1 = new RouteStop("Karedu Bus Stop", 1, 15.2050, 79.9200, "07:30 AM");
        RouteStop s2 = new RouteStop("Kandukur Junction", 2, 15.2150, 79.9000, "08:00 AM");
        RouteStop s3 = new RouteStop("Ongole Bus Stand", 3, 15.5050, 80.0490, "08:35 AM");
        RouteStop s4 = new RouteStop("College Main Gate", 4, 15.5250, 80.0650, "09:00 AM");

        route.addStop(s1);
        route.addStop(s2);
        route.addStop(s3);
        route.addStop(s4);
        route = routeRepository.save(route);

        // 5. Create Geofences
        geofenceRepository.save(new Geofence("Karedu Bus Stop", "BUS_STOP", 15.2050, 79.9200, 300.0));
        geofenceRepository.save(new Geofence("Kandukur Junction", "BUS_STOP", 15.2150, 79.9000, 400.0));
        geofenceRepository.save(new Geofence("Ongole Bus Stand", "BUS_STOP", 15.5050, 80.0490, 500.0));
        geofenceRepository.save(new Geofence("College Main Gate", "COLLEGE", 15.5250, 80.0650, 500.0));

        // 6. Create Bus (BUS-01) - Initialized in standby until driver starts trip and transmits genuine telemetry
        Bus bus = new Bus("BUS-01", 40, route, driver);
        bus.setCurrentLat(null);
        bus.setCurrentLng(null);
        bus.setLastLocationUpdate(null);
        bus.setTrackingSource(null);
        bus.setStatus(TripStatus.NOT_STARTED);
        bus = busRepository.save(bus);

        // 7. Create Students as requested
        User u1 = new User("veeru@buslink.com", passwordEncoder.encode("Student@123"), "E.veeru", "9123456781", Role.ROLE_STUDENT);
        studentRepository.save(new Student(u1, "23551A4601", "BUS-LINK College of Technology", bus, parent2));

        User u2 = new User("deepthi@buslink.com", passwordEncoder.encode("Student@123"), "B.Deepthi", "9123456782", Role.ROLE_STUDENT);
        studentRepository.save(new Student(u2, "23551A4602", "BUS-LINK College of Technology", bus, parent3));

        User u3 = new User("gayathri@buslink.com", passwordEncoder.encode("Student@123"), "P.gayathri", "9123456783", Role.ROLE_STUDENT);
        studentRepository.save(new Student(u3, "23551A4603", "BUS-LINK College of Technology", bus, parent4));

        User u4 = new User("sailaja@buslink.com", passwordEncoder.encode("Student@123"), "E.sailaja", "9123456784", Role.ROLE_STUDENT);
        studentRepository.save(new Student(u4, "23551A4604", "BUS-LINK College of Technology", bus, parent2));

        User u5 = new User("student@buslink.com", passwordEncoder.encode("Student@123"), "Veeru", "9123456789", Role.ROLE_STUDENT);
        studentRepository.save(new Student(u5, "STU1001", "BUS-LINK College of Technology", bus, parent1));

        System.out.println("=====================================================");
        System.out.println(">>> BUS-LINK 2.0 Security System Seeded Successfully! <<<");
        System.out.println("Admin: " + adminEmail + " / " + (configuredAdminPassword.equals("Admin@123") ? "Admin@123 (dev default)" : "[Configured via BUSLINK_ADMIN_PASSWORD]"));
        System.out.println("Student: student@buslink.com / Student@123");
        System.out.println("Parent: parent@buslink.com / Parent@123");
        System.out.println("Driver: driver@buslink.com / Driver@123");
        System.out.println("=====================================================");
    }
}
