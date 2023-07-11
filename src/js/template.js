// const DataUrl = "http://10.10.12.35:31222/?target=get&type_command=player&command=visualization"
// const DataUrl = "https://arena.geoscan.aero/game?target=get&type_command=player&command=visualization"
const DataUrl =  "http://127.0.0.1:5555/?target=get&type_command=player&command=visualization"
// const DataUrl = "http://10.10.12.146:31222/?target=get&type_command=player&command=visualization"

document.addEventListener("DOMContentLoaded", () => {
    const minimap = new Map(0, 1100, 11, 2);
    minimap.start_updating_map(100)

    const info_panel = new InformationPanel()
    // const vis_controller = new VisualizationController(info_panel, DataUrl)
    // vis_controller.start_visualization();
    get_objects(info_panel)
    get_info(info_panel);


    setInterval(function () {
        get_info(info_panel);
    }, 200);
})

function get_info(info_panel) {
    fetch(DataUrl).then(response =>
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
        }).catch(function (e) {
            console.log(e)
        }));
}

function get_objects(info_panel) {
    fetch(DataUrl).then(response =>
        response.json().then(data => ({
                data: data,
                status: response.status
            })
        ).then(res => {
            const team_value = Object.values(res.data.team_info)
            info_panel.add_panels(team_value[0].players, team_value[1].players)
        }).catch(function (e) {
            console.log(e)
        }));
}


