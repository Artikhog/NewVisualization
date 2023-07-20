const info_panel = new InformationPanel()
const big_map = new Map(-1, 1100, 11, 2);

let currentdate = new Date();
let time_between_fetch = null;


let get_visualization_url = null;
let get_config_url = null;
let get_web_info_url = null;

let get_info_interval = null

let visualization_updating_time = null;
let wait_connection_time = null;
let map_updating_time = null;
let map_background_src = null;


document.addEventListener("DOMContentLoaded", () => {
    fetch("/src/js/config.json").then(response => response.json())
        .then(data => {
            document.getElementById('wait_game').src = data.wait_game_src

            visualization_updating_time = data.visualization_updating_time
            wait_connection_time = data.wait_connection_time
            map_updating_time = data.map_updating_time
            map_background_src = data.map_background_src

            get_visualization_url = data.ip + data.get_visualization_command
            get_config_url = data.ip + data.get_config_command
            get_web_info_url = data.ip + data.get_web_info_command
            get_objects();

            big_map.init(get_config_url, get_web_info_url, map_background_src)
            big_map.start_updating_map(map_updating_time)
        })
})

function get_objects() {
        fetch(get_visualization_url).then(response => {
            if (response.ok) {
                response.json().then(data => ({
                        data: data,
                        status: response.status
                    })
                ).then(res => {
                    document.getElementById("wait_game").style.opacity = '0'
                    setTimeout(() => {
                        document.getElementById("wait_game").style.display = 'none'
                    }, 2000)


                    const team_value = Object.values(res.data.team_info)
                    info_panel.add_panels(team_value[0].players, team_value[1].players)
                    start_get_info()
                })
            } else {
                console.log(response.ok)
                throw new Error('Ошибка HTTP: ' + response.status);
            }
        }).catch(error => {
            if (error.message === 'Failed to fetch') {
                console.log('Ошибка соединения');
                set_wait_connection_status()
            } else {
                console.log(error)
            }
        });
}

function get_info() {
    fetch(get_visualization_url).then(response => {
        if (response.ok) {
            response.json().then(data => ({
                    data: data,
                    status: response.status
                })
            ).then(res => {

                const team_value = Object.values(res.data.team_info)

                document.getElementById('blue_team_balls').innerText = `${team_value[0].balls_team}`
                document.getElementById('red_team_balls').innerText = `${team_value[1].balls_team}`
                document.getElementById('blue_team_name').innerText = `${team_value[0].name_team}`
                document.getElementById('red_team_name').innerText = `${team_value[1].name_team}`
                document.getElementById('time').innerText = res.data.server_info.gameTime

                info_panel.update_panels(team_value[0].players, team_value[1].players)

                time_between_fetch = new Date().getTime() - currentdate.getTime()
                currentdate = new Date()
            })
        } else {
            throw new Error('Ошибка HTTP: ' + response.status);
        }
    }).catch(error => {
        stop_get_info()
        if (error.message === 'Failed to fetch') {
            console.log('Ошибка соединения');
            set_wait_connection_status()
        } else {
            console.log(error)
        }
    });
}

function start_get_info() {
    // big_map.init(get_config_url, get_web_info_url)
    // big_map.start_updating_map(map_updating_time)
    get_info_interval = setInterval(function () {
        get_info();
    }, visualization_updating_time);
}

function stop_get_info() {
    clearInterval(get_info_interval)
}

function set_wait_connection_status() {
    info_panel.clear_panels()
    console.log(document.getElementById("wait_game").style.display, document.getElementById("wait_game").style.opacity)
    document.getElementById("wait_game").style.display = 'block'
    setTimeout(() => {
        document.getElementById("wait_game").style.opacity = '1'
    }, 2000)
    setTimeout(() => {
        get_objects();
    }, wait_connection_time)
}

let is_dev_panel_open = false
let update_dev_panel_interval = null

document.addEventListener("keydown", (e) => {
    if (e.code === 'KeyP') {
        if (!is_dev_panel_open) {
            add_dev_panel()
            start_updating_dev_panel()
        } else {
            remove_dev_panel()
            stop_updating_dev_panel()
        }
    }
});

function add_dev_panel() {
    document.getElementById('developer_panel').style.bottom = '0'
    is_dev_panel_open = true
}

function remove_dev_panel() {
    document.getElementById('developer_panel').style.bottom = '-800px'
    is_dev_panel_open = false
}

function start_updating_dev_panel() {
    update_dev_panel_interval = setInterval(() => {
        document.getElementById('fps').innerText = `update time: ${time_between_fetch}`
        document.getElementById('blue_team_players_number').innerText = `blue team: ${info_panel.blue_player_panels.length}`
        document.getElementById('red_team_players_number').innerText = `red team: ${info_panel.red_player_panels.length}`
        document.getElementById('panels_switchers_number').innerText = `panels switchers: ${info_panel.switchers.length}`
    }, 200)
}

function stop_updating_dev_panel() {
    clearInterval(update_dev_panel_interval)
}





