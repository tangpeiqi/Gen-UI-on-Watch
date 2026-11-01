     # Pseudo Context Draft

## Persona Overview
This fictional persona lives in Kirkland, WA, works in Bellevue, WA, and has a busy, active lifestyle in the greater Seattle area. He works a full-time job, keeps a packed weekday schedule, and works out a few times a week. He usually listens to music or podcasts during his commute and workouts. Pays attention to his workout and exercise schedule to stay physically healthy and fit.

Outside of work, he spends spare time connecting with family and friends, getting outdoors, and staying close to nature. His ideal day feels balanced: productive at work, physically active, socially connected, and not too rushed. He appreciates small, timely nudges that help him move through the day with less friction.

## Actual Pseudo Context

Heart rate is sampled every 30 minutes during the demo schedule: 8:00 AM–9:30 PM today (America/Los_Angeles). All readings are fictional demo data. Future readings become available only when their timestamps are reached.

Outdoor temperature is sampled hourly from 7:00 AM to 9:00 PM today. Use the latest reading at or before the requested time; before 7:00 AM, no current temperature is available. Thermostat temperatures are indoor device readings and must not be used as outdoor weather.

Use the latest available reading and its age for the heart-rate widget. Today’s high and low are calculated from readings since local midnight up to the current time; do not include future samples.

Location headings describe the persona’s location phase; event locations describe venues or routes, and thermostat locations identify the home device.

### Today’s Context

#### Location: Home, Kirkland — Beginning of day–8:10 AM

- Last night’s sleep — 6 hr 28 min — Quality: Fair — Sleep score: 71
- Weather
  - Condition: Cloudy with light rain
  - Current temperature: Use the latest hourly outdoor-temperature reading in today’s timeline at or before the requested time.
  - High: 63°F
  - Low: 51°F
  - Rain chance: 68%
  - Wind: 8 mph southwest
- 7:00 AM: Thermostat — After waking up
  - Device name: Home thermostat
  - Status: Heating toward set temperature
  - Location: Home, Kirkland
  - Current temperature: 66°F
  - Set temperature: 70°F
  - Home status: Home
  - Control action: adjust set temperature
- 7:00 AM: Outdoor temperature — 52°F
- 8:00 AM: Heart rate — 72 bpm
- 8:00 AM: Outdoor temperature — 53°F
- 8:10 AM: Reminder — Choose podcast for morning commute — Reminder service time: today, morning — Mark complete action: mark reminder complete

#### Location: Bellevue office — 8:30 AM–12:10 PM

- 8:30 AM: Commute to office — Location: Kirkland to Bellevue
- 8:30 AM: Heart rate — 82 bpm
- 8:30 AM: Thermostat — Leaving home
  - Device name: Home thermostat
  - Status: Idle; above away set temperature
  - Location: Home, Kirkland
  - Current temperature: 70°F
  - Set temperature: 64°F
  - Home status: Away during workday
  - Control action: adjust set temperature
- 9:00 AM: Heart rate — 78 bpm
- 9:00 AM: Outdoor temperature — 54°F
- 9:05 AM: Reminder — Refill water bottle before planning sync — Reminder service time: today, morning — Mark complete action: mark reminder complete
- 9:15 AM: Weekly planning sync — Location: Bellevue office, 5th floor conference room
- 9:30 AM: Heart rate — 74 bpm
- 10:00 AM: Heart rate — 72 bpm
- 10:00 AM: Outdoor temperature — 55°F
- 10:15 AM: Reminder — Review project proposal notes — Reminder service time: today, late morning — Mark complete action: mark reminder complete
- 10:30 AM: Focus block for project proposal — Location: Bellevue office, quiet desk area
- 10:30 AM: Heart rate — 70 bpm
- 11:00 AM: Heart rate — 73 bpm
- 11:00 AM: Outdoor temperature — 56°F
- 11:30 AM: Heart rate — 76 bpm
- 12:00 PM: Heart rate — 79 bpm
- 12:00 PM: Observed activities — cumulative time today so far
  - Sitting: 3 hr
  - Standing: 1 hr
  - Walking: 25 min
- 12:00 PM: Outdoor temperature — 58°F
- 12:10 PM: Reminder — Take a lunch walk if rain is light — Reminder service time: today, midday — Mark complete action: mark reminder complete

#### Location: Downtown Bellevue Park — 12:15–12:30 PM

- 12:15 PM: Lunch walk — Location: Downtown Bellevue Park loop
- 12:30 PM: Heart rate — 108 bpm

#### Location: Bellevue office — 1:00–5:00 PM

- 1:00 PM: Heart rate — 86 bpm
- 1:00 PM: Thermostat — After lunch
  - Device name: Home thermostat
  - Status: Idle; above away set temperature
  - Location: Home, Kirkland
  - Current temperature: 65°F
  - Set temperature: 64°F
  - Home status: Away during workday
  - Control action: adjust set temperature
- 1:00 PM: Outdoor temperature — 60°F
- 1:18 PM: Message — Received from Maya: "Can everyone still do Saturday evening? I can bring drinks."
- 1:24 PM: Message — Received from Jordan: "I can make the playlist if someone handles snacks."
- 1:30 PM: Design review — Location: Bellevue office, design studio
- 1:30 PM: Heart rate — 78 bpm
- 1:31 PM: Message — Sent by persona: "Saturday works for me. I can bring chips, fruit, and sparkling water."
- 1:42 PM: Message — Received from Priya: "Perfect. Should we start around 6:30?"
- 2:00 PM: Heart rate — 75 bpm
- 2:00 PM: Outdoor temperature — 62°F
- 2:05 PM: Message — Received from Alex: "I can bring a couple board games and extra cups."
- 2:30 PM: Heart rate — 76 bpm
- 2:45 PM: Reminder — Review notes before one-on-one — Reminder service time: today, afternoon — Mark complete action: mark reminder complete
- 3:00 PM: One-on-one with manager — Location: Bellevue office, small meeting room
- 3:00 PM: Heart rate — 74 bpm
- 3:00 PM: Outdoor temperature — 63°F
- 3:30 PM: Heart rate — 73 bpm
- 4:00 PM: Heart rate — 77 bpm
- 4:00 PM: Outdoor temperature — 62°F
- 4:30 PM: Wrap-up and inbox triage — Location: Bellevue office, desk
- 4:30 PM: Heart rate — 75 bpm
- 4:45 PM: Reminder — Send dinner timing poll to friends — Reminder service time: today, late afternoon — Mark complete action: mark reminder complete
- 5:00 PM: Heart rate — 80 bpm
- 5:00 PM: Observed activities — cumulative time today so far
  - Sitting: 6 hr 30 min
  - Standing: 1 hr 45 min
  - Walking: 1 hr
- 5:00 PM: Thermostat — Leaving the office
  - Device name: Home thermostat
  - Status: Heating toward set temperature
  - Location: Home, Kirkland
  - Current temperature: 64°F
  - Set temperature: 70°F
  - Home status: Away; returning home
  - Control action: adjust set temperature
- 5:00 PM: Outdoor temperature — 61°F

#### Location: Bellevue, after-work errands — 5:30–6:00 PM

- 5:30 PM: Heart rate — 82 bpm
- 6:00 PM: Heart rate — 78 bpm
- 6:00 PM: Outdoor temperature — 59°F

#### Location: PCC Community Markets, Bellevue — 6:15 PM

- 6:15 PM: Grocery pickup — Location: PCC Community Markets, Bellevue
  - Navigation Context
    - Destination: PCC Community Markets, Bellevue
    - Traffic condition: Moderate traffic on NE 8th St, light congestion near Bellevue Way
    - Travel time: 12 min from Bellevue office
    - Time to leave: 6:00 PM to arrive by the 6:15 PM grocery pickup window
    - Distance: 2.6 miles
- 6:15 PM: Reminder — Pick up groceries after work — Reminder service time: today, early evening — Mark complete action: mark reminder complete

#### Location: Travelling home to Kirkland — 6:30 PM

- 6:30 PM: Heart rate — 84 bpm

#### Location: Home, Kirkland — 6:45–7:00 PM

- 6:45 PM: Thermostat — Arriving home
  - Device name: Home thermostat
  - Status: Heating toward set temperature
  - Location: Home, Kirkland
  - Current temperature: 69°F
  - Set temperature: 70°F
  - Home status: Home
  - Control action: adjust set temperature
- 7:00 PM: Heart rate — 80 bpm
- 7:00 PM: Outdoor temperature — 57°F

#### Location: Kirkland waterfront or home living room — 7:15–7:30 PM

- 7:15 PM: Easy run or indoor mobility session — Location: Kirkland waterfront or home living room
  - Workout Context
    - Workout type: Easy run
    - Elapsed time: Please improvise
    - Target duration: 28 min planned
    - Calories burned: Please improvise
    - Calorie goal: 300 calories
- 7:30 PM: Heart rate — 142 bpm

#### Location: Home, Kirkland — 8:00 PM–bedtime

- 8:00 PM: Heart rate — 104 bpm
- 8:00 PM: Reminder — Reply to family group chat — Reminder service time: today, evening — Mark complete action: mark reminder complete
- 8:00 PM: Outdoor temperature — 55°F
- 8:30 PM: Family video call — Location: Home, Kirkland
- 8:30 PM: Heart rate — 82 bpm
- 9:00 PM: Heart rate — 76 bpm
- 9:00 PM: Outdoor temperature — 54°F
- 9:30 PM: Heart rate — 72 bpm
- 9:30 PM: Observed activities — cumulative time today so far
  - Sitting: 8 hr 30 min
  - Standing: 2 hr 45 min
  - Walking: 1 hr 35 min
- 9:30 PM: Reminder — Stretch for 10 minutes if evening run is skipped — Reminder service time: today, night — Mark complete action: mark reminder complete
- 9:30 PM: Thermostat — End of day
  - Device name: Home thermostat
  - Status: Idle; above overnight set temperature
  - Location: Home, Kirkland
  - Current temperature: 70°F
  - Set temperature: 66°F
  - Home status: Home; preparing for bed
  - Control action: adjust set temperature
- Before bedtime: Reminder — Charge watch before bed — Reminder service time: today, bedtime — Mark complete action: mark reminder complete

### Tomorrow’s Context

- Weather
  - Condition: Partly cloudy
  - Forecast only: No current temperature observation exists for tomorrow; do not invent one.
  - High: 67°F
  - Low: 52°F
  - Rain chance: 24%
  - Wind: 6 mph west
- 7:45 AM: School drop-off favor for neighbor — Location: Peter Kirk Elementary, Kirkland
- 8:30 AM: Commute to work — Location: Kirkland to Bellevue
- 8:45 AM: Reminder — Confirm dental appointment paperwork — Reminder service time: tomorrow, morning — Mark complete action: mark reminder complete
- 9:00 AM: Dental appointment in downtown Bellevue — Location: Bellevue Dental Arts
- 10:30 AM: Email catch-up and coffee — Location: Bellden Cafe, Bellevue
- 11:00 AM: Focus block for prototype flow — Location: Bellevue office, quiet desk area
- 12:30 PM: Lunch with coworker — Location: Cactus, Bellevue Square
- 2:00 PM: Roadmap review — Location: Bellevue office, 4th floor conference room
- 3:30 PM: Quiet work block for design-pack notes — Location: Bellevue office, desk
- 5:45 PM: Strength workout at gym — Location: PRO Club, Bellevue
- 7:30 PM: Dinner out with friends at Tipsy Cow — Location: Tipsy Cow, Redmond
- 9:15 PM: Finance check-in and bill review — Location: Home, Kirkland

### Additional Context

Ongoing goals and other supporting information that are not tied to a specific event in the daily timelines.

#### Sleep Goal
- Sleep goal: At least 8 hours of sleep per day (`sleep_goal`: 8 hours).

#### Activity Goal
Daily goals for the current local day (configurable fictional demo values):
- Sitting time goal: No more than 8 hours per day (`sitting_time_goal`: 480 minutes).
- Standing time goal: At least 3 hours per day (`standing_time_goal`: 180 minutes).
- Walking time goal: At least 1 hour per day (`walking_time_goal`: 60 minutes).
- Combine these goals with the latest available activity snapshot. Divide each accumulated time by its corresponding daily goal using the same units; sitting progress measures the limit used, while standing and walking progress measure the target reached.

#### Grocery Checklist
- Checklist title: Grocery pickup list
- Completed items: None
- Mark complete action: Mark selected item complete
- Checklist due date and time: today, 6:15 PM
- Greek yogurt
- Blueberries
- Bananas
- Spinach
- Eggs
- Salmon
- Brown rice
- Sparkling water
- Coffee beans
- Trail mix

#### Future Reminders
- Buy coffee beans if running low — Reminder service time: the day after tomorrow, morning — Due: the day after tomorrow, afternoon — Mark complete action: mark reminder complete
- Plan weekend trail route — Reminder service time: four days later, evening — Due: four days later, 9 PM — Mark complete action: mark reminder complete

#### Timer Context
- No timer is active by default. Infer whether a timer would be useful from the current activity and additional context supplied by the user at runtime. Suggest a timer when it makes sense. Produce both countdown and total_duration in the same duration unit. Use the duration specified by the user; otherwise, choose an appropriate duration in minutes. A newly suggested timer starts with countdown equal to total_duration.

#### Music Playlist
##### Now Playing
- Song: Good Days
- Album: SOS
- Artist: SZA
- Playback state: paused
- Play/pause action: play
- Next action: next track
- Previous action: previous track

##### Queue
- "Cranes in the Sky" — Album: A Seat at the Table — Artist: Solange
- "Get You" — Album: Freudian — Artist: Daniel Caesar featuring Kali Uchis
- "Come Through and Chill" — Album: War & Leisure — Artist: Miguel featuring J. Cole and Salaam Remi
- "Focus" — Album: Take Me Apart — Artist: Kelela
- "Best Part" — Album: Freudian — Artist: Daniel Caesar featuring H.E.R.
- "Good Days" — Album: SOS — Artist: SZA
- "Pink + White" — Album: Blonde — Artist: Frank Ocean

#### Workout Context
- When the runtime goal specifies another workout type, generate plausible demo metadata appropriate to that workout type. Include workout_type, calories_burned, and elapsed_time during the workout or final duration after it. Generate appropriate target_duration and calorie_goal when useful; the easy-run targets are specific to the easy run and must not be reused automatically for other workout types.
