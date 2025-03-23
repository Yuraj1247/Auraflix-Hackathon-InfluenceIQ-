function Contact() {
    return (
      <section className="section" id="contact">
        <div>
          <h2 className="section-title">Contact Us</h2>
          <p>Have questions or feedback? Reach out to us!</p>
          <div className="form-container">
            <input type="text" placeholder="Name" />
            <input type="email" placeholder="Email" />
            <textarea placeholder="Message" rows="5"></textarea>
            <button className="cta-btn">Send</button>
          </div>
        </div>
      </section>
    );
  }
  
  export default Contact;