# engineering project

## how to make it run
to make this project working we have 2 layers that need to work.

First is backend, second is front-vite

To be able to run them we need node.js installed https://nodejs.org/en/download/

After node.js installation to be able to run our front we need also to enable corepack so we can use pnpm https://pnpm.io/installation (latest version should work perfect)
`corepack enable`
`corepack prepare pnpm@latest --activate`

now when those things installed and enabled we need to go to directory called 'back' and run command `npm i`. After installation is completed, to run backend we need to use command
`npm start`

after its done terminal should show information 'Example app listening on port 3000'


Now open new terminal, go to directory called front-vite.
run `pnpm i` command and after installation is done, to make frontend running use `pnpm dev` command

after those 2 things are done we should see info in terminal that Vite is ready and we can open our browser and go to http://localhost:5173

That's it! Congratulations, you made this app running and You can start using it. Enjoy!
