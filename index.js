const Hapi = require("hapi")
const Docker = require("dockerode")
const docker = new Docker()
const crypto = require("crypto")
const fs = require("fs")

const server = Hapi.server({
  port: 8080,
  host: "localhost",
  routes: { cors: true },
})

server.route({
  method: "GET",
  path: "/",
  handler: async (request, h) => {
    return "Hello, world!"
  },
})

//1048576 bytes = 1MB

server.route({
  method: "POST",
  path: "/upload",
  config: {
    payload: {
      maxBytes: 1048576,
      output: "stream",
      parse: true,
    },
  },
  handler: async (req, h) => {
    const payload = req.payload
    const files = payload.files
    const appName = genName()
    let file_paths = []

    if (Array.isArray(files)) {
      fs.mkdirSync(`./tmp/${appName}`)
      file_paths.push("Dockerfile")
      files.forEach(file => {
        console.log(file.hapi.filename)
        const wstream = fs.createWriteStream(
          `./tmp/${appName}/${file.hapi.filename}`
        )
        file.pipe(wstream)
        file_paths.push(`./${file.hapi.filename}`)
      })
      fs.copyFile("./Dockerfile", `./tmp/${appName}/Dockerfile`, err => {
        if (err) return
      })
      console.log(file_paths)
      docker.buildImage(
        {
          context: `${__dirname}/tmp/${appName}`,
          src: file_paths,
        },
        { t: appName },
        (err, response) => {
          let valid = true
          response.on("data", data => {
            data = JSON.parse(data.toString())
            if (data.errorDetail) {
              valid = false
              console.log(data.errorDetail.message)
            }
          })
          response.on("end", data => {
            console.log("Done whether the image has been created or not")
            if (valid) {
              let number = Math.floor(Math.random() * (6000 - 3000) + 3000)
              docker
                .createContainer({
                  Image: appName,
                  Tty: false,
                  PortBindings: {
                    "8080/tcp": [
                      {
                        HostPort: number.toString(),
                      },
                    ],
                  },
                })
                .then(container => {
                  container.start()
                  console.log("Container started and is listening on " + number)
                })
            }
          })
        }
      )
    } else {
      return "Not proper :("
    }

    return "Recived your data"
  },
})

const init = async () => {
  await server.start()
  console.log(`Server running at: ${server.info.uri}`)
}

process.on("unhandledRejection", err => {
  console.log(err)
  process.exit(1)
})

init()

const genName = () => {
  return crypto.randomBytes(20).toString("hex")
}
