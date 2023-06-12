const formData = require("form-data");
const Mailgun = require("mailgun.js");
const mailgun = new Mailgun(formData);
const domain = "sandbox12001a5f2a854d2ab30c594dd49f0dad.mailgun.org";
const mg = mailgun.client({ username: "api", key: process.env.MAILGUN_API_KEY });

const sendWelcomeEmail = (email, name) => {
  mg.messages
    .create(domain, {
      from: "mdgufran258@gmail.com",
      to: email,
      subject: "Thanks for joining in!",
      text: `Welcome to the app, ${name}. Let me know how you get along with the app.`,
    })
    .then((msg) => console.log(msg))
    .catch((err) => console.log(err));
};

const sendCancellationEmail = (name, email) => {
  mg.messages
    .create(domain, {
      to: email,
      from: "mdgufran258@gmail.com",
      subject: "Sad to see you go.",
      text: `Goodbye! ${name}. Is there anything we could have done to keep you onboard.`,
    })
    .then((msg) => console.log(msg))
    .catch((err) => console.log(err));
};

module.exports = {
  sendWelcomeEmail,
  sendCancellationEmail,
};

// mg.messages.create(domain, {
// 	from: "Excited User <mdgufran258@gmail.com>",
// 	to: ["mdgufran258@gmail.com"],
// 	subject: "Hello",
// 	text: "Testing some Mailgun awesomeness!",
// 	html: "<h1>Testing some Mailgun awesomeness!</h1>"
// })
// .then(msg => console.log(msg)) // logs response data
// .catch(err => {
//   console.log(err);
// }); // logs any error
