const fs = require("fs");
const admin = require("firebase-admin");

let delay = 10*60*1000;
let path = "/Users/vuongpham/tmp/downloads";
let linkPrefix = "https://file.vuong.work";
let databaseName = "beta";
let firebaseConfigFile = "./configs/ani-tv-863ff-firebase-adminsdk-i1ds4-7b78f14132.json";
let databaseURL = "https://ani-tv-863ff.firebaseio.com";

const serviceAccount = require(firebaseConfigFile);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: databaseURL
});

function getAllVideosIn(dir, videos) {
    //Returns all videos in a directory recursively
    let files = fs.readdirSync(dir);

    files
        .forEach((file) => {
            let filePath = `${dir}/${file}`;
            if (fs.lstatSync(filePath).isDirectory()) {
                getAllVideosIn(filePath, videos);
            } else if (filePath.endsWith(".mkv") || filePath.endsWith(".mp4")) {
                videos.push(filePath);
            }
        });

    return videos;
}

function getShowsSync() {
    let shows = {};
    let files = fs.readdirSync(path);

    //Gets all directories
    files
        .filter((file) => fs.lstatSync(`${path}/${file}`).isDirectory())
        .forEach((directory) => {
            // Create a show object
            let episodes = {};
            let videos = getAllVideosIn(`${path}/${directory}`, []);

            for (let i = 0; i < videos.length; i++) {
                episodes[i+1] = {
                    "name": videos[i].split('/').pop(),
                    "path": videos[i],
                    "link": linkPrefix + videos[i].substr(path.length, videos[i].length),
                };
            }

            //Create a show
            shows[directory] = {
                "name": directory,
                "path": `${path}/${directory}`,
                "episodes": episodes
            }
        });
    return shows;
}

let updateShows = () =>{
    let shows = getShowsSync();

    admin.database().ref(`/${databaseName}`).child("shows").set(shows);
};

updateShows();
setInterval(updateShows, delay);