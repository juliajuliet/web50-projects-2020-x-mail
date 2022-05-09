document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  document.querySelector('#compose-form').addEventListener('submit', send_mail);

  // By default, load the inbox
  load_mailbox('inbox');
});

function send_mail(event) {
  event.preventDefault();
  let form = document.querySelector('#compose-form');
  let recipients = form.elements['compose-recipients'].value;
  let subject = form.elements['compose-subject'].value;
  let body = form.elements['compose-body'].value;
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: recipients,
        subject: subject,
        body: body
    })
  })
  .then(response => response.json())
  .then(result => {
    // Print result
    if (result['error']) {
      return compose_email();
    } else {
      return load_mailbox('sent');
    }
  });
  return false;
}

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function show_email(mailbox, id) {
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'block';

  fetch(`emails/${id}`)
  .then(response => response.json())
  .then(email => {
    email_view(mailbox, email);
  })

  fetch(`emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      read: true
    })
  })
}

function archive_email(data) {
  fetch(`emails/${data["id"]}`, {
    method: 'PUT',
    body: JSON.stringify({
      archived: !data["archived"]
    })
  })
  .then(response => load_mailbox('inbox'))
}

function reply_email(data) {
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = `${data["sender"]}`;
  document.querySelector('#compose-subject').value = `Re: ${data["subject"]}`;
  document.querySelector('#compose-body').value = `On ${data["timestamp"]} ${data["sender"]} wrote: 
  ${data["body"]}`;
}

function emails_view(mailbox) {
  let emails_view = document.getElementById('emails-view');
  let head = document.createElement('div');
  let to_from = document.createElement('p');
  let subject = document.createElement('p');
  let body = document.createElement('p');
  emails_view.appendChild(head);
  head.appendChild(to_from);
  head.appendChild(subject);
  head.appendChild(body);
  head.classList.add('emails-head');

  if (mailbox == 'inbox' || mailbox == 'archive') {
    to_from.innerHTML = `<b>From </b>`;
  } else {
    to_from.innerHTML = `<b>To </b>`;
  }
  subject.innerHTML = `<b>Subject </b>`;
  body.innerHTML = `<b>Body </b>`;
}

function emails_list(mailbox, data) {
  let emails_view = document.getElementById('emails-view');
  //let emails = document.createElement('div');
  let email = document.createElement('div');
  let username = document.createElement('p');
  let email_subject = document.createElement('p');
  let email_body = document.createElement('p');
  let email_time = document.createElement('p');
  emails_view.appendChild(email);
  //emails.appendChild(email);
  email.appendChild(username); 
  email.appendChild(email_subject);
  email.appendChild(email_body);
  email.appendChild(email_time);
  email.classList.add('emails-list');
  if (data["read"] === true) {
    email.style.background = "rgb(230, 230, 230)";
  }
  if (mailbox == 'inbox' || mailbox == 'archive') {
    username.innerText = `${data["sender"]}`;
  } else if (mailbox == 'sent') {
    username.innerText = `${data["recipients"]}`;
  }
  email_subject.innerText = `${data["subject"]}`;
  email_body.innerText = `${data["body"]}`;
  email_time.innerText = `${data["timestamp"]}`;
  email_time.style.fontSize = '10px';

  email.addEventListener('click', () => show_email(mailbox, data["id"]));
}

function email_view(mailbox, data) {
  document.querySelector('#email-view').innerHTML = '';
  let email_view = document.getElementById('email-view');
  let email_view_top = document.createElement('div');
  let sender = document.createElement('p');
  let recipients = document.createElement('p');
  let subject = document.createElement('p');
  let time = document.createElement('p');
  
  let email_view_bottom = document.createElement('div');
  email_view.appendChild(email_view_top);
  email_view.appendChild(email_view_bottom);
  email_view_top.appendChild(sender);
  email_view_top.appendChild(recipients);
  email_view_top.appendChild(subject);
  email_view_top.appendChild(time);
  let buttons = document.createElement('div');
  let btn_reply = document.createElement('button');
  email_view_top.appendChild(buttons);
  buttons.appendChild(btn_reply);
  buttons.classList.add('buttons');
  btn_reply.classList.add('btn-reply');
  btn_reply.addEventListener('click', () => reply_email(data));
  if (mailbox == 'inbox' || mailbox == 'archive') {
    let btn_archive = document.createElement('button');
    buttons.appendChild(btn_archive);
    btn_archive.classList.add('btn-archive');
    btn_archive.addEventListener('click', () => archive_email(data));
  }
  email_view_top.classList.add('email-view-top');

  sender.innerHTML = `<b> From: </b> ${data["sender"]}`;
  recipients.innerHTML = `<b> To: </b> ${data["recipients"]}`;
  subject.innerHTML = `<b> Subject: </b> ${data["subject"]}`;
  time.innerText = `${data["timestamp"]}`;
  time.style.fontSize = "10px";
  email_view_bottom.innerText = `${data["body"]}`;
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';
  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  fetch(`emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    console.log(emails);
    emails_view(mailbox);
    emails.forEach(email => {
        emails_list(mailbox, email);
    })
  });
}