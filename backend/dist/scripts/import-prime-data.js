"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var fs = require("fs");
var path = require("path");
var sync_1 = require("csv-parse/sync");
var prisma = new client_1.PrismaClient();
var DATA_FILE_PATH = path.join(process.cwd(), '..', 'Old database', 'Prime Setup App - Form Responses.csv');
var TARGET_TEAM_SLUG = 'primepowerteam';
// Helper to map values
var mapSession = function (csvVal) {
    if (!csvVal)
        return 'Practice 1';
    var v = csvVal.trim();
    if (v.includes('Qualifying') || v.includes('Time Trial'))
        return 'Qualifying';
    if (v.includes('Final'))
        return 'Final';
    if (v.includes('Pre Final') || v.includes('Prefinal'))
        return 'PreFinal';
    if (v.includes('Heat')) {
        if (v.includes('1'))
            return 'Heat1';
        if (v.includes('2'))
            return 'Heat2';
        if (v.includes('3'))
            return 'Heat3';
        if (v.includes('4'))
            return 'Heat4';
        return 'Heat1'; // Default heat
    }
    if (v.includes('Warm'))
        return 'WarmUp';
    if (v.includes('Practice 1'))
        return 'Practice1';
    if (v.includes('Practice 2'))
        return 'Practice2';
    if (v.includes('Practice 3'))
        return 'Practice3';
    // ... basic mapping, fallback to Practice1 if not clear
    return 'Practice1';
};
// Map 'Rear Hubs Material' to Enum
var mapMaterial = function (val) {
    if (!val)
        return 'Aluminium'; // Default
    if (val.toLowerCase().includes('mag'))
        return 'Magnesium';
    return 'Aluminium';
};
// Map Height
var mapHeight = function (val) {
    if (!val)
        return 'Standard';
    var v = val.toLowerCase();
    if (v.includes('low'))
        return 'Low';
    if (v.includes('med'))
        return 'Medium';
    if (v.includes('high'))
        return 'High';
    return 'Standard';
};
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var fileContent, records, team, successCount, errorCount, _i, records_1, record, firstName, lastName, sanitizedFirst, sanitizedLast, userEmail, user, createdAt, chassis, seatPosition, spindleVal, hotPressure, coldPressure, bestLap, pressureString, extraNotes, observation, err_1;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    console.log("Reading CSV from ".concat(DATA_FILE_PATH, "..."));
                    if (!fs.existsSync(DATA_FILE_PATH)) {
                        console.error("File not found: ".concat(DATA_FILE_PATH));
                        process.exit(1);
                    }
                    fileContent = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
                    records = (0, sync_1.parse)(fileContent, {
                        columns: true,
                        skip_empty_lines: true,
                        trim: true
                    });
                    console.log("Found ".concat(records.length, " records. Fetching team '").concat(TARGET_TEAM_SLUG, "'..."));
                    return [4 /*yield*/, prisma.team.findUnique({
                            where: { slug: TARGET_TEAM_SLUG }
                        })];
                case 1:
                    team = _c.sent();
                    if (!team) {
                        console.error("Team ".concat(TARGET_TEAM_SLUG, " not found."));
                        process.exit(1);
                    }
                    successCount = 0;
                    errorCount = 0;
                    _i = 0, records_1 = records;
                    _c.label = 2;
                case 2:
                    if (!(_i < records_1.length)) return [3 /*break*/, 10];
                    record = records_1[_i];
                    _c.label = 3;
                case 3:
                    _c.trys.push([3, 8, , 9]);
                    firstName = (_a = record['First Name']) === null || _a === void 0 ? void 0 : _a.trim();
                    lastName = (_b = record['Last Name']) === null || _b === void 0 ? void 0 : _b.trim();
                    if (!firstName || !lastName) {
                        // Skip records without names? Or default?
                        // CSV seems to have names for most.
                        return [3 /*break*/, 9];
                    }
                    sanitizedFirst = firstName.toLowerCase().replace(/[^a-z0-9]/g, '');
                    sanitizedLast = lastName.toLowerCase().replace(/[^a-z0-9]/g, '');
                    userEmail = "".concat(sanitizedFirst, ".").concat(sanitizedLast, "@prime.data");
                    return [4 /*yield*/, prisma.user.findUnique({ where: { email: userEmail } })];
                case 4:
                    user = _c.sent();
                    if (!!user) return [3 /*break*/, 6];
                    return [4 /*yield*/, prisma.user.create({
                            data: {
                                email: userEmail,
                                firstName: firstName,
                                lastName: lastName,
                                teamId: team.id
                            }
                        })];
                case 5:
                    user = _c.sent();
                    _c.label = 6;
                case 6:
                    createdAt = new Date(record['Submission Date']);
                    chassis = "";
                    seatPosition = "";
                    spindleVal = "Standard";
                    hotPressure = record['Hot Pressure'] || '';
                    coldPressure = record['Cold Pressure'] || '';
                    bestLap = record['Best Lap Number'] || '';
                    pressureString = hotPressure
                        ? "".concat(coldPressure, " (Hot: ").concat(hotPressure, ")")
                        : coldPressure;
                    extraNotes = [];
                    if (bestLap)
                        extraNotes.push("Best Lap #: ".concat(bestLap));
                    if (record['General Notes'])
                        extraNotes.push(record['General Notes']);
                    if (record['Changes List'])
                        extraNotes.push("Changes: ".concat(record['Changes List']));
                    // Also add Hot Pressure to conclusion just in case
                    if (hotPressure)
                        extraNotes.push("Hot Pressure: ".concat(hotPressure));
                    if (coldPressure)
                        extraNotes.push("Cold Pressure: ".concat(coldPressure));
                    observation = extraNotes.join('\n');
                    return [4 /*yield*/, prisma.submission.create({
                            data: {
                                userId: user.id,
                                teamId: team.id,
                                createdAt: isNaN(createdAt.getTime()) ? new Date() : createdAt,
                                track: record['Track'] || '',
                                championship: record['Championship'] || '',
                                division: record['Division'] || '',
                                sessionType: mapSession(record['Session Type']),
                                classCode: 'Sr', // Enum required, defaulting
                                engineNumber: record['Engine Number'] || '',
                                gearRatio: record['Gear Ratio'] || '',
                                // Optional String fields in schema can be null/undefined or empty string?
                                // Schema: `driveSprocket String?`
                                driveSprocket: null,
                                drivenSprocket: null,
                                carburatorNumber: null,
                                tyreModel: record['Tyre model'] || '',
                                tyreAge: record['Tyre Condition'] || '',
                                tyreColdPressure: pressureString,
                                chassis: chassis, // String, required
                                axle: record['Axle'] || '',
                                rearHubsMaterial: mapMaterial(record['Rear Hubs Material']), // Enum Required
                                rearHubsLength: record['Rear Hubs length'] || '',
                                frontHeight: mapHeight(record['Front Height']), // Enum Required
                                backHeight: mapHeight(record['Back Height']), // Enum Required
                                frontHubsMaterial: null, // Optional Enum
                                frontBar: 'Standard', // Enum Required (Defaulting)
                                spindle: 'Standard', // Enum Required (Defaulting)
                                caster: record['Caster'] || '',
                                seatPosition: seatPosition, // String Required -> ""
                                lapTime: record['Lap time'] || '',
                                observation: observation,
                                isFavorite: false
                            }
                        })];
                case 7:
                    _c.sent();
                    successCount++;
                    return [3 /*break*/, 9];
                case 8:
                    err_1 = _c.sent();
                    console.error("Error on record ".concat(record['Submission ID'], ":"), err_1);
                    errorCount++;
                    return [3 /*break*/, 9];
                case 9:
                    _i++;
                    return [3 /*break*/, 2];
                case 10:
                    console.log("Import finished. Success: ".concat(successCount, ", Failed: ").concat(errorCount));
                    return [2 /*return*/];
            }
        });
    });
}
main()
    .catch(function (e) {
    console.error(e);
    process.exit(1);
})
    .finally(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma.$disconnect()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
