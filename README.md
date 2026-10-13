# DCRS Node prototype

A separate Next.js and React version of the DCRS practitioner reporting journey. It reuses the section and question definitions from the existing Blazor prototype and is structured to deploy from this directory as a Vercel project.

## Run locally

```sh
npm install
npm run dev
```

Open `http://localhost:3000`.

## Deploy to Vercel

Import the repository into Vercel and set **Root Directory** to `DCRS-Node`. Vercel will detect Next.js. The production build command is `npm run build`.

## Prototype behaviour and limitations

- Answers, submission state and evidence filenames are stored in the current browser's local storage.
- Essential information submission creates a local prototype submission ID and displays the confirmation screen; it does not send data to the Insolvency Service.
- Uploaded evidence contents are not uploaded or retained. Only the filenames are stored in the browser.
- The Further information activation, reset and clear controls are available under **Prototype testing tools**.
- This is not suitable for real or sensitive reports. A live service needs authentication and case authorisation, server-side durable storage, secure evidence upload and scanning, retention controls, audit logging, and an approved submission integration.

The app includes a local copy of GOV.UK Frontend styles, font files, and the DCRS questions JSON so `DCRS-Node` can be configured as its own Vercel project root.
