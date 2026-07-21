import { db } from './firebase-config.js';
import { collection, addDoc, serverTimestamp, getDocs } from "firebase/firestore";

// ===== Loading =====
window.addEventListener("load", () => {
    document.querySelector(".loader").classList.add("hide");
});

// ===== Mobile Menu =====
const menuToggle = document.getElementById("menuToggle");
const nav = document.getElementById("nav");
if (menuToggle) {
    menuToggle.addEventListener("click", () => nav.classList.toggle("open"));
    nav.querySelectorAll("a").forEach(a => a.addEventListener("click", () => nav.classList.remove("open")));
}

// ===== Navbar Scroll =====
const header = document.getElementById("header");
const topBtn = document.getElementById("topBtn");
window.addEventListener("scroll", () => {
    if (window.scrollY > 50) header.classList.add("scrolled");
    else header.classList.remove("scrolled");
    if (window.scrollY > 500) topBtn.classList.add("show");
    else topBtn.classList.remove("show");
});

// ===== Counters =====
function counter(id, target) {
    let n = 0;
    const step = Math.max(1, Math.ceil(target / 100));
    const interval = setInterval(() => {
        n += step;
        if (n >= target) { n = target; clearInterval(interval); }
        const el = document.getElementById(id);
        if (el) el.textContent = n.toLocaleString("en-US") + "+";
    }, 20);
}
counter("hs1", 10000);
counter("hs2", 30);
counter("hs3", 10);
counter("c1", 10000);
counter("c2", 5000);
counter("c3", 30);
counter("c4", 10);

// ===== Toast =====
export function showToast(msg) {
    const toast = document.getElementById("toast");
    toast.innerText = msg;
    toast.style.display = "block";
    setTimeout(() => { toast.style.display = "none"; }, 3000);
}

// ===== Search Trips =====
const search = document.getElementById("searchTrip");
if (search) {
    search.addEventListener("keyup", () => {
        const value = search.value.toLowerCase();
        document.querySelectorAll(".trip-card").forEach(card => {
            card.style.display = card.innerText.toLowerCase().includes(value) ? "block" : "none";
        });
    });
}

// ===== Filter Trips =====
const filter = document.getElementById("filterCountry");
if (filter) {
    filter.addEventListener("change", () => {
        const value = filter.value;
        document.querySelectorAll(".trip-card").forEach(card => {
            card.style.display = (value === "" || card.dataset.country === value) ? "block" : "none";
        });
    });
}

// ===== Book Buttons =====
document.querySelectorAll(".book-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        const notes = document.getElementById("notes");
        if (notes) notes.value = "الرحلة المطلوبة: " + btn.dataset.trip;
        document.getElementById("booking").scrollIntoView({ behavior: "smooth" });
    });
});

// ===== FAQ =====
document.querySelectorAll(".faq-q").forEach(q => {
    q.addEventListener("click", () => {
        q.parentElement.classList.toggle("open");
    });
});

// ===== Booking Form =====
const booking = document.getElementById("bookingForm");
if (booking) {
    booking.addEventListener("submit", async function(e) {
        e.preventDefault();
        try {
            const data = {
                name: document.getElementById("fullName").value,
                phone: document.getElementById("phone").value,
                email: document.getElementById("email").value,
                notes: document.getElementById("notes").value,
                createdAt: serverTimestamp()
            };
            await addDoc(collection(db, "bookings"), data);
            showToast("تم إرسال طلب الحجز بنجاح");
            this.reset();
        } catch (err) {
            console.error("خطأ إرسال الحجز:", err);
            showToast("تعذر إرسال الطلب: " + (err.message || "خطأ غير معروف"));
        }
    });
}

// ===== Load Trips =====
async function loadTrips() {
    try {
        const snapshot = await getDocs(collection(db, "trips"));
        const container = document.getElementById("tripsContainer");
        container.innerHTML = "";
        snapshot.forEach(doc => {
            const trip = doc.data();
            const card = document.createElement("div");
            card.className = "card trip-card";
            card.dataset.country = trip.country || "";
            card.innerHTML = `
                <div class="trip-body">
                    <h3>${trip.name || "رحلة"}</h3>
                    <p>${trip.country || ""}</p>
                    <p class="trip-price">${trip.price || 0}$ <span>/ للشخص</span></p>
                    <button class="btn btn-block book-btn" data-trip="${trip.name || ""}">احجز الآن</button>
                </div>
            `;
            container.appendChild(card);
        });
    } catch (err) {
        console.log("خطأ في تحميل الرحلات:", err);
    }
}
loadTrips();

// ===== Flight Search =====
const flightForm = document.getElementById("flightSearchForm");
const flightStatus = document.getElementById("flightStatus");
const flightResults = document.getElementById("flightResults");
const flightSearchBtn = document.getElementById("flightSearchBtn");

const departInput = document.getElementById("flightDepartDate");
if (departInput) {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const toISO = (d) => d.toISOString().split("T")[0];
    departInput.min = toISO(today);
    departInput.value = toISO(tomorrow);
}

function renderFlightResults(offers) {
    flightResults.innerHTML = "";
    if (!offers || offers.length === 0) {
        flightResults.innerHTML = `<div class="flight-empty">ما فيه رحلات متاحة على هذا المسار والتاريخ. جرب تاريخ أو مطار ثاني.</div>`;
        return;
    }
    offers.slice(0, 15).forEach(offer => {
        const card = document.createElement("div");
        card.className = "flight-result-card";
        card.innerHTML = `
            <div class="flight-info">
                <div class="flight-airline">${offer.airline || "شركة طيران"}</div>
                <div class="flight-route">${offer.origin || ""} → ${offer.destination || ""}</div>
                <div class="flight-times">🛫 ${offer.departure || ""} — 🛬 ${offer.arrival || ""}</div>
                <div class="flight-meta-badges">
                    <span class="flight-badge">${offer.stops === 0 ? "رحلة مباشرة" : offer.stops + " توقف"}</span>
                </div>
            </div>
            <div class="flight-price-block">
                <div class="flight-price">${offer.price || "—"} <span>${offer.currency || "USD"}</span></div>
                <a href="#booking" class="btn" style="padding:10px 26px;font-size:14px;">احجز هذه الرحلة</a>
            </div>
        `;
        flightResults.appendChild(card);
    });
}

if (flightForm) {
    flightForm.addEventListener("submit", async function(e) {
        e.preventDefault();
        const origin = document.getElementById("flightOrigin").value.trim().toUpperCase();
        const destination = document.getElementById("flightDestination").value.trim().toUpperCase();
        const departDate = document.getElementById("flightDepartDate").value;
        const passengers = document.getElementById("flightPassengers").value;

        if (origin.length !== 3 || destination.length !== 3) {
            flightResults.innerHTML = `<div class="flight-error">رجاءً أدخل رمز مطار مكوّن من 3 أحرف (مثال: KWI، IST، DXB).</div>`;
            return;
        }

        flightResults.innerHTML = "";
        flightStatus.classList.add("show");
        flightStatusText.textContent = "جاري البحث عن أفضل الرحلات المتاحة...";
        flightSearchBtn.disabled = true;
        flightSearchBtn.style.opacity = ".6";

        try {
            const response = await fetch("/.netlify/functions/search-flights", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ origin, destination, departureDate: departDate, passengers: Number(passengers) })
            });
            if (!response.ok) throw new Error(`خطأ من الخادم (${response.status})`);
            const data = await response.json();
            renderFlightResults(data.offers || []);
        } catch (err) {
            console.error("خطأ بحث الرحلات:", err);
            flightResults.innerHTML = `<div class="flight-error">تعذر جلب نتائج الرحلات. حاول مرة أخرى.</div>`;
        } finally {
            flightStatus.classList.remove("show");
            flightSearchBtn.disabled = false;
            flightSearchBtn.style.opacity = "1";
        }
    });
}
