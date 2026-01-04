
// Native http module 
// actually, modern node has fetch built-in (experimental in v18, stable in v21).
// let's try standard http

const http = require('http');

const data = JSON.stringify({
    userEmail: "tester@example.com",
    firstName: "Test",
    lastName: "Driver",
    teamSlug: "tkg-birelart",
    track: "Localhost Test Track " + new Date().toISOString(),
    tyreModel: "MG Red",
    tyreAge: "New",
    tyreColdPressure: "10.0",
    chassis: "Birel ART",
    axle: "Standard",
    rearHubsMaterial: "Aluminium",
    rearHubsLength: "90mm",
    frontHeight: "Standard",
    backHeight: "Standard",
    frontBar: "Standard",
    spindle: "Standard",
    caster: "Neutral",
    seatPosition: "P1",
    sessionType: "Practice 1",
    engineNumber: "TEST-123",
    classCode: "Sr"
});

const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/submissions',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
        console.log(`BODY: ${chunk}`);
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.write(data);
req.end();
