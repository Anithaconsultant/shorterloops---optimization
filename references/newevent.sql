DELIMITER //

CREATE EVENT timer_event
ON SCHEDULE EVERY 1 SECOND
DO
BEGIN
    DECLARE city_id_val, clock_tick_rate_val, current_time_val, current_day_val, new_current_time, new_current_day INT;
    DECLARE done BOOLEAN DEFAULT FALSE;

    -- Create a temporary table to store updated values
   
    DECLARE cur CURSOR FOR SELECT CityId, Clocktickrate, CurrentTime, CurrentDay FROM city;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    OPEN cur;
	CREATE TEMPORARY TABLE IF NOT EXISTS temp_city_update (
			CityID INT,
			NewCurrentTime INT,
			NewCurrentDay INT
		);

    read_loop: LOOP
        FETCH cur INTO city_id_val, clock_tick_rate_val, current_time_val, current_day_val;
        IF done THEN
            LEAVE read_loop;
        END IF;

        -- Calculate new values for current time and current day
        SET new_current_time = current_time_val + (clock_tick_rate_val * 300);
        SET new_current_day = current_day_val;

        IF new_current_time >= 86400 THEN
            SET new_current_time = new_current_time - 86400;
            SET new_current_day = new_current_day + 1;
        END IF;

        -- Insert the updated values into the temporary table
        INSERT INTO temp_city_update (CityID, NewCurrentTime, NewCurrentDay) 
        VALUES (city_id_val, new_current_time, new_current_day);
    END LOOP;

    CLOSE cur;

    -- Update the original table using values from the temporary table
    UPDATE city AS c
    JOIN temp_city_update AS tcu ON c.CityID = tcu.CityID
    SET c.CurrentTime = tcu.NewCurrentTime,
        c.CurrentDay = tcu.NewCurrentDay;

    -- Drop the temporary table
    DROP TEMPORARY TABLE IF EXISTS temp_city_update;
END;
//

DELIMITER ;


DELIMITER //

CREATE EVENT timer_event
ON SCHEDULE EVERY 1 SECOND
DO
BEGIN
    DECLARE city_id_val, clock_tick_rate_val, current_time_val, current_day_val, new_current_time, new_current_day INT;
    DECLARE done BOOLEAN DEFAULT FALSE;

    DECLARE cur CURSOR FOR SELECT CityId, Clocktickrate, CurrentTime, CurrentDay FROM city;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    OPEN cur;

    read_loop: LOOP
        FETCH cur INTO city_id_val, clock_tick_rate_val, current_time_val, current_day_val;
        IF done THEN
            LEAVE read_loop;
        END IF;

        -- Calculate new values for current time and current day
        SET new_current_time = current_time_val + (clock_tick_rate_val * 300);
        SET new_current_day = current_day_val;

        IF new_current_time >= 86400 THEN
            SET new_current_time = new_current_time - 86400;
            SET new_current_day = new_current_day + 1;
        END IF;

        -- Update the city table
        UPDATE city SET CurrentTime = new_current_time, CurrentDay = new_current_day WHERE CityID = city_id_val;
    END LOOP;

    CLOSE cur;
END;
//

DELIMITER ;

USE newfresh;
-- Drop the existing event
DROP EVENT IF EXISTS timer_event;

DELIMITER //

CREATE EVENT timer_event
ON SCHEDULE EVERY 1 SECOND
DO
BEGIN
    DECLARE city_id_val, clock_tick_rate_val, current_time_val, current_day_val, new_current_time, new_current_day INT;
    DECLARE done BOOLEAN DEFAULT FALSE;

    DECLARE cur CURSOR FOR SELECT CityId, Clocktickrate, CurrentTime, CurrentDay FROM city;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    -- Create a temporary table to store updated values
    CREATE TEMPORARY TABLE temp_city_update (
        CityID INT,
        NewCurrentTime INT,
        NewCurrentDay INT
    );

    OPEN cur;

    read_loop: LOOP
        FETCH cur INTO city_id_val, clock_tick_rate_val, current_time_val, current_day_val;
        IF done THEN
            LEAVE read_loop;
        END IF;

        -- Calculate new values for current time and current day
        SET new_current_time = current_time_val + (clock_tick_rate_val * 300);
        SET new_current_day = current_day_val;

        IF new_current_time >= 86400 THEN
            SET new_current_time = new_current_time - 86400;
            SET new_current_day = new_current_day + 1;
        END IF;

        -- Insert the updated values into the temporary table
        INSERT INTO temp_city_update (CityID, NewCurrentTime, NewCurrentDay) VALUES (city_id_val, new_current_time, new_current_day);
    END LOOP;

    CLOSE cur;

    -- Update the main table with values from the temporary table
    UPDATE city
    INNER JOIN temp_city_update ON city.CityID = temp_city_update.CityID
    SET city.CurrentTime = temp_city_update.NewCurrentTime,
        city.CurrentDay = temp_city_update.NewCurrentDay;

    -- Drop the temporary table
    DROP TEMPORARY TABLE IF EXISTS temp_city_update;
END;
//

DELIMITER ;


