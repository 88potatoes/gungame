# how to set up

first make a file in the root directory called info.json and add the local ip address of your pc
for example:

```
{
    "ip_address": "192.168.50.66"
}
```

then in different terminals, run 

```
npm install
npx watchify gungame/gungamedesktop.js -o dist/gungame.js
npx watchify gungame/gungamecontroller.js -o dist/gungamecontroller.js
npx tailwindcss -i src/input.css -o dist/output.css --watch
npx nodemon server.js
```