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
    // تأكد من وجود مفتاح Duffel في متغيرات البيئة
    if(!process.env.DUFFEL_API_KEY){
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "مفتاح Duffel غير مكوّن على الخادم. اتصل بالمسؤول." })
      };
    }
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
        statusCode: duffelResponse.status || 500,
        body: JSON.stringify({
          error: "تعذر البحث عن رحلات من مزود الخدمة. حاول لاحقاً.",
          details: data,
        }),
      };
    }

    // نُعيد النتائج كما وردت من Duffel (محددة بعدد قليل لتقليل النقل)
    const offers = (data.data && data.data.offers) ? data.data.offers.slice(0,15) : [];

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
