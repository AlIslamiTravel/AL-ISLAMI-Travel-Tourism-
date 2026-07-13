// netlify/functions/search-flights.js
// هذا الملف يشتغل على السيرفر فقط (Netlify Function)
// مفتاح Duffel يقرأ من Environment Variable، أبداً لا يظهر للمستخدم

exports.handler = async function (event) {
  // نسمح فقط بطلبات POST
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const body = JSON.parse(event.body);
    const { origin, destination, departureDate, returnDate, passengers } = body;

    if (!origin || !destination || !departureDate) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "الرجاء تعبئة المطار المغادر والوجهة وتاريخ السفر" }),
      };
    }

    const slices = [
      { origin, destination, departure_date: departureDate },
    ];

    // لو فيه تاريخ عودة، نضيف رحلة العودة (رحلة ذهاب وعودة)
    if (returnDate) {
      slices.push({
        origin: destination,
        destination: origin,
        departure_date: returnDate,
      });
    }

    const passengerCount = passengers && passengers > 0 ? passengers : 1;
    const passengersArray = Array.from({ length: passengerCount }, () => ({
      type: "adult",
    }));

    const duffelResponse = await fetch(
      "https://api.duffel.com/air/offer_requests?return_offers=true",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.DUFFEL_API_KEY}`,
          "Duffel-Version": "v2",
          Accept: "application/json",
        },
        body: JSON.stringify({
          data: {
            slices,
            passengers: passengersArray,
            cabin_class: "economy",
          },
        }),
      }
    );

    const data = await duffelResponse.json();

    if (!duffelResponse.ok) {
      console.error("Duffel error:", JSON.stringify(data));
      return {
        statusCode: duffelResponse.status,
        body: JSON.stringify({
          error: "تعذر البحث عن رحلات، حاول مرة أخرى",
          details: data,
        }),
      };
    }

    // نرجع فقط أول 15 عرض عشان نخفف حجم الرد
    const offers = (data.data.offers || []).slice(0, 15).map((offer) => ({
      id: offer.id,
      total_amount: offer.total_amount,
      total_currency: offer.total_currency,
      slices: offer.slices.map((slice) => ({
        origin: slice.origin.iata_code,
        destination: slice.destination.iata_code,
        duration: slice.duration,
        segments: slice.segments.map((seg) => ({
          airline: seg.marketing_carrier.name,
          flight_number: seg.marketing_carrier_flight_number,
          departing_at: seg.departing_at,
          arriving_at: seg.arriving_at,
        })),
      })),
    }));

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ offers }),
    };
  } catch (err) {
    console.error("Function error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "حدث خطأ غير متوقع بالسيرفر" }),
    };
  }
};
