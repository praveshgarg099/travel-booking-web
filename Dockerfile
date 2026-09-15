# Stage 1: Build the Spring Boot application using Maven and Java 21 LTS
FROM maven:3.9.6-eclipse-temurin-21 AS builder
WORKDIR /build

# Copy Maven configuration and source code
COPY pom.xml .
COPY src ./src

# Build production JAR package
RUN mvn clean package -DskipTests

# Stage 2: Lightweight runtime environment
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

# Copy executable jar from builder stage
COPY --from=builder /build/target/travelBookingWeb-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8080

ENV PORT=8080
ENV SPRING_PROFILES_ACTIVE=prod

ENTRYPOINT ["sh", "-c", "java -Dserver.port=${PORT} -Dspring.profiles.active=${SPRING_PROFILES_ACTIVE} -jar app.jar"]
