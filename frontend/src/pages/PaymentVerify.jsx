import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { api } from "../api/axios";

export default function PaymentVerify() {
  const [searchParams] = useSearchParams();
  const nav = useNavigate();
  const [status, setStatus] = useState("verifying"); // verifying | success | failed
  const [message, setMessage] = useState("Verifying your payment...");

  useEffect(() => {
    (async () => {
      const pidx = searchParams.get("pidx");
      const txnStatus = searchParams.get("status");
      const bookingId = searchParams.get("purchase_order_id");

      if (!pidx) {
        setStatus("failed");
        setMessage("No payment reference found.");
        return;
      }

      // If Khalti redirected with status=Completed or User Canceled
      if (txnStatus === "User canceled") {
        setStatus("failed");
        setMessage("Payment was cancelled.");
        return;
      }

      try {
        const res = await api.post("/api/payments/khalti/verify", { pidx, bookingId });

        if (res.data.status === "PAID") {
          setStatus("success");
          setMessage("Payment successful! Your booking is confirmed.");
        } else if (res.data.status === "PENDING") {
          setStatus("verifying");
          setMessage("Payment is still being processed. Please check back shortly.");
        } else {
          setStatus("failed");
          setMessage(`Payment status: ${res.data.status}. ${res.data.message || ""}`);
        }
      } catch (err) {
        setStatus("failed");
        setMessage(err?.response?.data?.message || "Payment verification failed.");
      }
    })();
  }, [searchParams]);

  return (
    <div style={{ minHeight: "80vh", display: "grid", placeItems: "center" }}>
      <div className="panel" style={{ maxWidth: 500, textAlign: "center" }}>
        {status === "verifying" && (
          <>
            <h1>Verifying Payment</h1>
            <p className="muted mt-md">{message}</p>
          </>
        )}

        {status === "success" && (
          <>
            <div style={{ fontSize: 48, marginBottom: 12 }}>&#10003;</div>
            <h1 className="text-ok">Payment Successful</h1>
            <p className="muted mt-md">{message}</p>
            <button className="btn ok mt-md" onClick={() => nav("/my-bookings")}>
              View My Bookings
            </button>
          </>
        )}

        {status === "failed" && (
          <>
            <div style={{ fontSize: 48, marginBottom: 12 }}>&#10007;</div>
            <h1 className="text-danger">Payment Failed</h1>
            <p className="muted mt-md">{message}</p>
            <div className="flex-gap mt-md" style={{ justifyContent: "center" }}>
              <button className="btn" onClick={() => nav("/my-bookings")}>My Bookings</button>
              <button className="btn ghost" onClick={() => nav("/pitches")}>Browse Pitches</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}