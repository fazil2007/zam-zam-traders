import { useState } from "react";

const contacts = [
{
name: "WhatsApp 1",
number: "919944263946",
},
{
name: "WhatsApp 2",
number: "919500487920",
},
];

export default function WhatsAppButton() {
const [isOpen, setIsOpen] = useState(false);

const openWhatsApp = (number) => {
const message = encodeURIComponent(
"Hello Zam Zam Traders! I would like to enquire about your building materials and prices."
);


window.open(
  `https://wa.me/${number}?text=${message}`,
  "_blank",
  "noopener,noreferrer"
);

setIsOpen(false);


};

return (
<div
style={{
position: "fixed",
right: "20px",
bottom: "20px",
zIndex: 9999,
fontFamily: "Arial, sans-serif",
}}
>
{/* Contact selection popup */}
{isOpen && (
<div
style={{
backgroundColor: "#ffffff",
padding: "16px",
borderRadius: "12px",
boxShadow: "0 4px 18px rgba(0, 0, 0, 0.2)",
marginBottom: "12px",
width: "240px",
boxSizing: "border-box",
}}
>
<h3
style={{
margin: "0 0 12px",
fontSize: "16px",
color: "#222222",
}}
>
Contact Zam Zam Traders </h3>


      {contacts.map((contact) => (
        <button
          key={contact.number}
          type="button"
          onClick={() => openWhatsApp(contact.number)}
          style={{
            display: "block",
            width: "100%",
            marginBottom: "8px",
            padding: "12px 8px",
            border: "none",
            borderRadius: "8px",
            backgroundColor: "#25D366",
            color: "#ffffff",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "13px",
          }}
        >
          {contact.name}: +{contact.number.slice(0, 2)}{" "}
          {contact.number.slice(2)}
        </button>
      ))}

      <button
        type="button"
        onClick={() => setIsOpen(false)}
        style={{
          width: "100%",
          padding: "9px",
          border: "1px solid #dddddd",
          borderRadius: "8px",
          backgroundColor: "#ffffff",
          color: "#333333",
          cursor: "pointer",
        }}
      >
        Close
      </button>
    </div>
  )}

  {/* Floating WhatsApp button */}
  <button
    type="button"
    onClick={() => setIsOpen((previous) => !previous)}
    aria-label="Contact Zam Zam Traders on WhatsApp"
    aria-expanded={isOpen}
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "60px",
      height: "60px",
      borderRadius: "50%",
      border: "none",
      backgroundColor: "#25D366",
      color: "#ffffff",
      fontSize: "28px",
      cursor: "pointer",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.25)",
    }}
  >
    <span aria-hidden="true">✆</span>
  </button>
</div>


);
}
