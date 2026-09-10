# Fish Finder, Electronics, and Wiring

**Status:** OneNote PDF + MHT links migrated. Historical-chat audit still in progress.

## Current electronics

| Component | Manufacturer / model | Details | Status / Evidence |
|---|---|---|---|
| Fish finder | [Humminbird Helix 5 CHIRP DI GPS G3](https://humminbird.johnsonoutdoors.com/us/shop/fish-finders/helix/helix-5-chirp-di-gps-g3) | 2D sonar, Down Imaging, GPS; base map only; OneNote price note $360; [software update page](https://humminbird-help.johnsonoutdoors.com/hc/en-us/articles/25950149299351-HELIX-5-CHIRP-DI-GPS-G3-Software-Update?_gl=1%2A4grday%2A_gcl_dc%2AR0NMLjE3Nzk4MjUwOTYuOGMxYTA0NTJhMmQ5MTQ5NzIwZDE2ZTU5YTlhZmQ3YzU.%2A_gcl_au%2AMjAzNjc3ODc3LjE3NzkxMzE5NjI.%2AFPAU%2AMjAzNjc3ODc3LjE3NzkxMzE5NjI.%2A_ga%2AOTU3MzA1MjA2LjE3NzkxMzE5NjI.%2A_ga_JE4T2LF5XP%2AczE3Nzk4MjUwODAkbzQkZzEkdDE3Nzk4MjYzNjckajUwJGwwJGgxNDExNzkyMTQw%2A_fplc%2AdDZJOURaamM0Mjc3UHUycjF5eHZHM2JjdUZvJTJCZnNGWjhLSGJCa05GZERWJTJCRTgwUk1yNDB0VHUyWEpmTVIlMkJUVVd6bzFBU2h3WUEzQ3hmdWxMJTJGY1ZLQmw5bFN0TkRIQ014ZDhqWjQ4N2FXd3duQWdKQlRDQiUyRmlvOGFiTVMwdyUzRCUzRA..) | OWNED / user stated + OneNote source |
| Transducer | [Humminbird XNT 9 HW DI T](https://humminbird.johnsonoutdoors.com/us/shop/accessories/transducers/xnt-9-hw-di-t-down-imaging-dual-spectrum-chirp-w-temp-transom) | OneNote price note $180 | OWNED / user stated + OneNote source |
| Mapping | Garmin Navionics app | Detailed lake contours on phone | USER STATED |
| Battery | [Amped Outdoors 12V 8Ah](https://ampedoutdoors.com/products/8ah-lithium-battery-lifepo4?_pos=1&_psq=8ah&_ss=e&_v=1.0), sourced via [Eco Fishing](https://ecofishingshop.com/products/8ah-lithium-battery-lifepo4) | 2 lb; 3A charger; 2.5 hr charge time; OneNote price note $75 via Eco Fishing | OWNED / OneNote source |
| Charger | Included 3A charger | 2.5 hr charge time per OneNote | OWNED / OneNote source |

## Planning roles

- **Navionics phone app:** primary bathymetry/contour planning tool.
- **Helix 5:** confirms depth, weeds, bottom changes, bait, fish marks, and water temperature.
- **No side imaging / no forward-facing sonar:** plans should not assume scanning far to the sides or ahead.

## Controls and setup notes

### Buttons / controls

- Power: press to turn on; long-press to turn off; while on, press to access Sonar, Backlight, Background, and Standby menus.
- `+ / -`: zoom keys; in sonar zoom view adjust zoom range; in sonar views adjust sensitivity; in chart views adjust chart range.
- `VIEW`: press to rotate views; rotate backward with `EXIT`; long-press opens View X-Press menu.
- Cursor pad: moves active cursor in sonar/chart views and navigates menus.
- `MENU`: press once for X-Press menu; twice for main menu.
- Check mark: in chart view opens chart info submenu; in sonar switches frequencies; with active cursor displays chart info.
- `MARK`: press once to mark waypoint at boat position; press twice to mark waypoint at cursor; press and hold to save screenshot if SD card is installed.
- `GOTO/MOB`: press once to display saved navigation data; with cursor active, press once to start navigating to waypoint.
- `EXIT`: close menu, exit cursor, turn off alarm, or rotate view backward.

### Quick setup

- Max depth examples from OneNote: Lake Sammamish 105'; Lake Washington 214'.
- Water type: Fresh.
- Verify GPS reception: press and hold `VIEW` → System → GPS Diagnostic View; Fix Type should be Enhanced or 3D; lat/lon should display and can be compared to Navionics.
- Test transducer: put boat in at least 2' of water, turn on control head, press and hold `VIEW` → Sonar → Sonar View, verify bottom/depth, paddle full speed and verify bottom is not skipped/missed.

## Sonar setup and adjustment notes

- Main Menu → Sonar.
- Noise Filter: Off or 1; OneNote notes motorless kayak usually does not need much filtering.
- Digital Depth Source: Auto.
- Water Type: Fresh.
- CHIRP Configuration: Main Menu → Setup → CHIRP Configuration; 2D mode and DI/Imaging should be On; SI mode should be Off.
- 2D CHIRP Display Frequency/Spectrum:
  - Full: complete frequency range.
  - Narrow: increased bottom detail and target separation.
  - Wide: maximum coverage and big fish arches.
- DI CHIRP Display Frequency:
  - 800 kHz: shallow water up to 125' and sharpest image.
  - 455 kHz: deeper water up to 400'.
- Filter Surface Clutter: decrease if needed to reduce noise from algae/aeration.
- 2D SwitchFire: Clear Mode reduces/interprets noise; Max Mode shows raw sonar data.
- Fish ID+: can be turned on; Fish ID sensitivity can be decreased to show only larger fish; Fish ID Alarm on/off.
- Bottom View: set to White Line to highlight strongest sonar return in white.
- Time/date: Main Menu → Setup.
- Default waypoint icon: Main Menu → Nav tab → Waypoint Settings → Default Waypoint Icon.

## Views / chart / navigation

- Press and hold `VIEW` to choose sonar, down imaging, chart, or combo views.
- Use `+ / -` to adjust sensitivity or chart range depending on view.
- Use cursor to freeze/review sonar or DI history; distance/bearing to cursor is shown.
- Split View can compare frequencies.
- DI X-Press menu allows Sensitivity, Enhance, Contrast, Sharpness, Upper/Lower Range, Chart Speed, and DI Colors.
- Chart options include orientation, auto zoom, lat/long lines, depth shading, and detail levels.
- Create waypoint at boat position with `MARK`; at cursor with `MARK` twice.
- With cursor over waypoint/position, press `GOTO` twice to navigate.
- Reset XTE available from chart/navigation menu if off-route.
- Manage waypoints/routes/tracks from Main Menu → Nav tab.
- System Status shows self-test, software version, and voltage.

## Wiring / installation architecture

OneNote architecture text:

- Positive battery terminal → battery disconnect → inline fuse → panel connector → stock wire → head unit → black wire.
- Negative battery terminal → battery disconnect.

Parts list from OneNote:

| Item | Detail | Status |
|---|---|---|
| Head unit | [Humminbird Helix 5 CHIRP DI GPS G3](https://humminbird.johnsonoutdoors.com/us/shop/fish-finders/helix/helix-5-chirp-di-gps-g3) | OWNED |
| Transducer | [XNT 9 HW DI T](https://humminbird.johnsonoutdoors.com/us/shop/accessories/transducers/xnt-9-hw-di-t-down-imaging-dual-spectrum-chirp-w-temp-transom) | OWNED |
| Battery | [Amped Outdoors 12V 8Ah](https://ampedoutdoors.com/products/8ah-lithium-battery-lifepo4?_pos=1&_psq=8ah&_ss=e&_v=1.0), 2 lb, 3A charger, 2.5 hr charge time; [Eco Fishing source](https://ecofishingshop.com/products/8ah-lithium-battery-lifepo4) | OWNED |
| Battery disconnects | [2, 22-18 AWG female heat-shrink](https://a.co/d/05LPczBP) | OWNED / installation state needs confirmation |
| Inline fuse | [3A, 18 AWG](https://a.co/d/00QrdI02) | OWNED / installation state needs confirmation |
| Waterproof panel connector | [2-pin, IP68](https://a.co/d/0avzFYdU) | OWNED / exact brand and installation state needs confirmation |

Earlier historical-chat seed also mentioned Weipu SP13, M12 gland, SAE quick disconnect, 18 AWG stranded wire, 3:1 5/16" heat shrink, F2 spades, 0.250" female heat-shrink connectors, butt connectors, solder cups, and transducer hardware. These remain historical-chat audit items unless confirmed by OneNote or user.

## Software update

OneNote references the [HELIX 5 CHIRP DI GPS G3 Software Update – Humminbird](https://humminbird-help.johnsonoutdoors.com/hc/en-us/articles/25950149299351-HELIX-5-CHIRP-DI-GPS-G3-Software-Update?_gl=1%2A4grday%2A_gcl_dc%2AR0NMLjE3Nzk4MjUwOTYuOGMxYTA0NTJhMmQ5MTQ5NzIwZDE2ZTU5YTlhZmQ3YzU.%2A_gcl_au%2AMjAzNjc3ODc3LjE3NzkxMzE5NjI.%2AFPAU%2AMjAzNjc3ODc3LjE3NzkxMzE5NjI.%2A_ga%2AOTU3MzA1MjA2LjE3NzkxMzE5NjI.%2A_ga_JE4T2LF5XP%2AczE3Nzk4MjUwODAkbzQkZzEkdDE3Nzk4MjYzNjckajUwJGwwJGgxNDExNzkyMTQw%2A_fplc%2AdDZJOURaamM0Mjc3UHUycjF5eHZHM2JjdUZvJTJCZnNGWjhLSGJCa05GZERWJTJCRTgwUk1yNDB0VHUyWEpmTVIlMkJUVVd6bzFBU2h3WUEzQ3hmdWxMJTJGY1ZLQmw5bFN0TkRIQ014ZDhqWjQ4N2FXd3duQWdKQlRDQiUyRmlvOGFiTVMwdyUzRCUzRA..).

## Researched/candidate electronics and motor notes

These belong in `Researched_Candidate_Gear.md`, not current registry:

- Garmin ClearVu, SideVu, LiveScope concepts.
- [Garmin EchoMap Ultra 2 106sv LiveScope Plus + Navionics Vision+ bundle](https://www.thegpsstore.com/Brands/Garmin-GPS-Marine-Electronics/Garmin-LiveScope/Garmin-ECHOMAP-Ultra-2-106sv-10-LiveScope-Plus-and-Navionics-Vision-Bundle), with OneNote purchasing source [TheGPSstore.com](https://www.thegpsstore.com).
- [Garmin GT56UHD transom mount transducer](https://www.garmin.com/en-US/p/736677/pn/010-13073-00/); OneNote also linked a [TheGPSstore listing](https://www.thegpsstore.com/Marine-Electronics/Transducers/Garmin-GT-56-UHD-Transom-Mount-Transducer).
- [Garmin Force Current motor](https://www.garmin.com/en-US/p/1059449/) with wireless foot pedals; OneNote also included an [installation video](https://youtu.be/_GyqVaE71fk?si=DluDw8wcH8fPw5er) and a [quick-connect / fuse-breaker video](https://youtu.be/f6zm8hRho-M?si=XQqJvTW1_Lli4VHq&t=365).
- [Bonafide Stern Motor Mount](https://bonafidefishing.com/products/stern-motoranchor-mount-rvr?pr_prod_strat=e5_desc&pr_rec_id=1f1321c75&pr_rec_pid=7522817736894&pr_ref_pid=7906896937150&pr_seq=uniform) required for motor path.
- 12V vs 24V motor note: 12V = 40 lb thrust, 24V = 50 lb thrust; top speed noted as same in OneNote, difference framed as low-end torque and runtime/amperage.
- 24-to-12V DC-DC converter concept for powering electronics from a motor battery.
- Bluetooth battery candidate brands: Amped Outdoors, Power Queen, Li Time, Dakota, Newport.

## TODOs

- Verify actual installed wiring/fuse/battery layout.
- Verify exact panel connector brand/model and whether historical Weipu SP13 note matches installed part.
- Verify transducer installation hardware and final position/orientation.

## Cross-references

- Gear registry: `../Fishing_Gear_Registry.md`
- Kayak: `Bonafide_RVR119_Kayak.md`
- Rigging/storage: `Kayak_Rigging_Accessories_Storage.md`
- Researched/candidate gear: `Researched_Candidate_Gear.md`
- Maintenance: `Maintenance_Repairs_Procedures.md`