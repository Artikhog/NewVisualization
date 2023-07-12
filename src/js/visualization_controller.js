const GetVisualizationUrl = "http://127.0.0.1:5555/?target=get&type_command=player&command=visualization"
const GetConfigUrl = "http://127.0.0.1:5555/?target=get&type_command=player&command=config"
const GetVisInfoUrl = "http://127.0.0.1:5555/?target=get&type_command=player&command=game"

get_commands_url(GetConfigUrl, GetVisInfoUrl, GetVisualizationUrl)


// const get_drones_position = "http://10.10.12.146:31222/game?target=get&type_command=player&command=get_web_info"
// const url_map_objects_data = "http://10.10.12.146:31222/game?target=get&type_command=core&command=get_config";


const info_panel = new InformationPanel()
const big_map = new Map(-1, 1100, 11, 2, GetConfigUrl, GetVisInfoUrl);
let get_info_interval = null

document.addEventListener("DOMContentLoaded", () => {
    big_map.start_updating_map(100)
    get_objects();
})

function get_objects() {
        fetch(GetVisualizationUrl).then(response => {
            if (response.ok) {
                response.json().then(data => ({
                        data: data,
                        status: response.status
                    })
                ).then(res => {
                    document.getElementById("wait_game").style.opacity = '0'

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
    fetch(GetVisualizationUrl).then(response => {
        if (response.ok) {
            response.json().then(data => ({
                    data: data,
                    status: response.status
                })
            ).then(res => {

                const team_value = Object.values(res.data.team_info)

                document.getElementById('blue_team_balls').innerText = `${team_value[0].balls_team}`
                document.getElementById('red_team_balls').innerText = `${team_value[1].balls_team}`
                document.getElementById('time').innerText = res.data.server_info.gameTime

                info_panel.update_panels(team_value[0].players, team_value[1].players)

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
    get_info_interval = setInterval(function () {
        get_info();
    }, 200);
}

function stop_get_info() {
    clearInterval(get_info_interval)
    console.log(get_info_interval)
}

function set_wait_connection_status() {
    info_panel.clear_panels()
    document.getElementById("wait_game").style.opacity = '1'
    setTimeout(() => {
        get_objects();
    }, 2000)
}





