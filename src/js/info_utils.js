const directory_path = "./src/img/"

// class VisualizationController{
//     constructor(info_panel, server_url) {
//         this.info_panel = info_panel;
//         this.server_url = server_url
//         this.wait_img = document.getElementById('wait_game')
//         this.is_game = true;
//         this.get_info_interval = null;
//     }
//     start_visualization() {
//         try {
//             this.get_objects()
//             this.wait_img.style.display = 'none';
//             setInterval(function () {
//                 get_info();
//             }, 200);
//         } catch (e) {
//             console.log('fsdfsfsf')
//             this.is_game = false
//             this.wait_img.style.display = 'block';
//             setTimeout(() => {
//                 this.start_visualization()
//             }, 2000)
//         }
//     }
//     get_info() {
//         fetch(this.server_url).then(response =>
//             response.json().then(data => ({
//                     data: data,
//                     status: response.status
//                 })
//             ).then(res => {
//
//                 const team_value = Object.values(res.data.team_info)
//
//                 document.getElementById('blue_team_balls').innerText = `${team_value[0].balls_team}`
//                 document.getElementById('red_team_balls').innerText = `${team_value[1].balls_team}`
//                 document.getElementById('time').innerText = res.data.server_info.gameTime
//
//                 this.info_panel.update_panels(team_value[0].players, team_value[1].players)
//             }).catch(function (e) {
//                 console.log(e)
//             }));
//     }
//     get_objects() {
//         fetch(this.server_url).then(response =>
//             response.json().then(data => ({
//                     data: data,
//                     status: response.status
//                 })
//             ).then(res => {
//                 const team_value = Object.values(res.data.team_info)
//                 this.info_panel.add_panels(team_value[0].players, team_value[1].players)
//             }).catch(function (e) {
//                 console.log(e)
//             }));
//     }
// }


class InformationPanel{
    constructor() {
        this.blue_player_panels = []
        this.red_player_panels = []
    }
    add_panels(blue_players_data, red_players_data) {
        const blue_players_data_array = Object.values(blue_players_data)
        const red_players_data_array = Object.values(red_players_data)
        let blue_players_count = 0
        blue_players_data_array.forEach(player_data => {
            if (player_data.name_role !== "EmptyRole") {
                console.log('blue', blue_players_count)
                this.blue_player_panels.push(new PlayerPanel('blue', blue_players_count))
                blue_players_count++
            } else if (player_data.name_role === "EmptyRole") {
                console.log('blue', blue_players_count)
                this.blue_player_panels.push(new PlayerPanel('blue', blue_players_count, false))
                blue_players_count++
            }
        })
        let red_players_count = 0
        red_players_data_array.forEach(player_data => {
            if (player_data.name_role !== "EmptyRole") {
                console.log('red', red_players_count)
                this.red_player_panels.push(new PlayerPanel('red', red_players_count))
                red_players_count++
            } else {
                console.log('red', red_players_count)
                this.red_player_panels.push(new PlayerPanel('red', red_players_count, false))
                red_players_count++
            }
        })

        if (this.blue_player_panels.length > 5) {
            var blue_switcher = new Panels_Switcher('blue')
            blue_switcher.start_animation();
        }
        if (this.red_player_panels.length > 5) {
            var red_switcher = new Panels_Switcher('red')
            red_switcher.start_animation();
        }
    }
    update_panels(blue_players_data, red_players_data) {
        const blue_players_data_array = Object.values(blue_players_data)
        const red_players_data_array = Object.values(red_players_data)
        let blue_players_count = 0
        blue_players_data_array.forEach(player_data => {
            this.blue_player_panels[blue_players_count].set_data(player_data)
            blue_players_count++
        })
        let red_players_count = 0
        red_players_data_array.forEach(player_data => {
            this.red_player_panels[red_players_count].set_data(player_data)
            red_players_count++

        })
    }
}

class PlayerPanel{
    constructor(team_color, number, is_player=true) {
        if (number < 5) {
            this.player_div = document.getElementsByClassName(`${team_color}_team_div`)[0].getElementsByClassName(`${team_color}_player_div`)[number]
        } else {
            if (Math.floor(number / 5) === document.getElementsByClassName(`${team_color}_team_div`).length) {
                create_new_team_div(team_color, Math.floor(number / 5)-1)
            }
            this.player_div = document.getElementsByClassName(`${team_color}_team_div`)[Math.floor(number / 5)].getElementsByClassName(`${team_color}_player_div`)[number%5]
        }
        this.player_div.getElementsByClassName(`${team_color}_player_name`)[0].innerHTML = `ИГРОК ${number+1}`
        this.player_div.style.display = 'block'
        this.team_color = team_color;
        this.number = number;
        this.is_player = is_player;
        this.points =  this.player_div.getElementsByClassName(`${team_color}_player_balls`)[0]
        this.camera = this.player_div.getElementsByClassName(`${team_color}_player_camera`)[0]
        this.drone_image = this.player_div.getElementsByClassName(`${team_color}_drone_img`)[0]
        this.box_image = this.player_div.getElementsByClassName(`${team_color}_box_img`)[0]
        this.bullet_image_array = this.player_div.getElementsByClassName('bullet_img')
        this.status_img = this.player_div.getElementsByClassName(`${team_color}_status_img`)[0]
        this.status_marker = this.player_div.getElementsByClassName(`${team_color}_status_marker`)[0]
        this.block_marker = this.player_div.getElementsByClassName(`block_img`)[0]
    }
    set_data(player_data) {
        if (this.is_player) {
            this.points.innerText = `${player_data.balls}`;
            this.set_drone(player_data.name_object_controll);
            this.set_bullet(player_data.bullet);
            this.set_box(player_data.color_cargo, player_data.is_cargo);
            this.set_player_status(player_data.repair, true, player_data.is_blocking);
        } else {
            this.set_box(player_data.color_cargo, player_data.is_cargo);
            this.set_spectator_status(player_data.is_connected)
        }
    }
    set_drone(type) {
        switch (type) {
            case 'EduBotObject':
                this.drone_image.src = `${directory_path}${this.team_color}_car.png`;
                break;
            case 'PioneerObject':
                this.drone_image.src = `${directory_path}${this.team_color}_drone.png`
                break;
            case 'TestObject':
                this.drone_image.src = `${directory_path}${this.team_color}_drone.png`
                break;
        }
    }
    set_bullet(bullet_number) {
        for (let i = 0; i < bullet_number; i++) {
            this.bullet_image_array[i].style.display = 'block';
        }
        for (let i = bullet_number; i < 3; i++) {
            this.bullet_image_array[i].style.display = 'none';
        }
    }
    set_box(box_color_array, is_cargo) {
        if (is_cargo) {
            this.box_image.src = `${directory_path}${rgb_parser(box_color_array)}_box.png`
            this.box_image.style.display = "block";
        }
        else {
            this.box_image.style.display = "none";
        }
    }
    set_player_status(is_repair, is_connected, is_blocking) {
        if (is_repair) {
            this.player_div.style.background = 'rgb(191, 191, 191)';
            this.player_div.style.border = '4px solid rgb(161, 161, 161)';
            this.status_marker.innerHTML = 'В ремонте';
            this.status_img.src = "./src/img/repair.png";
            this.set_none_status();
        }
        else if (!is_connected) {
            this.player_div.style.background = 'rgb(255, 255, 255)';
            this.player_div.style.border = '4px solid rgba(0, 0, 0, 0.25)';
            this.status_marker.innerHTML = 'Подключение...';
            this.status_img.src = "./src/img/connection.png";
            this.set_none_status();
        } else if (is_blocking) {
            this.player_div.style.background = 'rgb(255, 255, 255)';
            this.player_div.style.border = '4px solid rgb(255, 216, 115)';
            this.status_marker.innerHTML = 'Заблокирован';
            this.status_img.src = "./src/img/block.png";
            this.block_marker.style.display = 'block';
            this.set_none_status();
        } else if (this.team_color === 'red') {
            this.player_div.style.background = 'rgb(255, 167, 174)';
            this.player_div.style.border = '4px solid rgb(255, 131, 141)';
            this.set_block_status();
        } else if (this.team_color === 'blue') {
            this.player_div.style.background = 'rgb(168, 196, 222)';
            this.player_div.style.border = '4px solid rgb(145, 190, 232)';
            this.set_block_status();
        }
    }
    set_spectator_status(is_connected) {
        if (!is_connected) {
            this.player_div.style.background = 'rgb(255, 255, 255)';
            this.player_div.style.border = '4px solid rgba(0, 0, 0, 0.25)';
            this.status_marker.innerHTML = 'Подключение...';
            this.status_img.src = "./src/img/connection.png";
            this.set_none_status();

        } else if (this.team_color === 'red') {
            this.player_div.style.background = 'rgb(255, 167, 174)';
            this.player_div.style.border = '4px solid rgb(255, 131, 141)';
            this.set_camera_status()
        } else if (this.team_color === 'blue') {
            this.player_div.style.background = 'rgb(168, 196, 222)';
            this.player_div.style.border = '4px solid rgb(145, 190, 232)';
            this.set_camera_status()
        }
    }
    set_none_status() {
        this.status_img.style.display = 'block';
        this.status_marker.style.display = 'block';
        this.points.style.display = 'none';
        this.drone_image.style.display = 'none';
        this.box_image.style.display = 'none';
        this.set_bullet(0);
    }
    set_block_status() {
        this.status_marker.style.display = 'none';
        this.status_img.style.display = 'none';
        this.points.style.display = 'block';
        this.drone_image.style.display = 'block';
        this.block_marker.style.display = 'none';
    }
    set_camera_status() {
        this.camera.style.display = 'block';
        this.status_marker.style.display = 'none';
        this.status_img.style.display = 'none';
        this.points.style.display = 'none';
        this.drone_image.style.display = 'none';
        this.set_bullet(0);
    }
}

class Panels_Switcher {
    constructor(team_color) {
        this.team_color = team_color
        this.current_list = 0
        this.panel_group_array = document.getElementsByClassName(`${this.team_color}_team_div`)
        this.list_number = this.panel_group_array.length
        document.getElementById(`${this.team_color}_team_list_counter`).style.display = 'block';
        this.list_counter = document.getElementById(`${this.team_color}_team_list_counter`).getElementsByClassName('team_count')
        add_counter(this.list_counter, this.list_number);
    }
    start_animation() {
        setInterval(() => {
            this.update_current_list()
        }, 4000)
    }
    update_current_list() {
        this.current_list = (this.current_list + 1) % this.list_number
        this.updateSliderPosition()
    }
    updateSliderPosition() {
        for (let i = 0; i < this.list_number; i++) {
            this.panel_group_array[i].style.opacity = '0'
            this.list_counter[i].style.background = 'rgb(191, 191, 191)';
        }
        setTimeout(() => {
            this.panel_group_array[this.current_list].style.opacity = '1'
            this.list_counter[this.current_list].style.background = 'rgb(117, 146, 109)';
        }, 1200)
    }
}

function create_new_team_div(team_color, current_team_div) {
    var team_div = document.getElementsByClassName(`${team_color}_team_div`)[current_team_div]
    var new_team_div = team_div.cloneNode(true)
    new_team_div.style.opacity = '0'
    for (let i = 0; i < 5; i++) {
        new_team_div.getElementsByClassName(`${team_color}_player_div`)[i].style.display = 'none';
    }
    team_div.after(new_team_div)
}

function add_counter(list_counter, list_number) {
    const first = list_counter[0]
    for (let i = 1; i < list_number; i++) {
        var new_list = first.cloneNode(true)
        new_list.style.background = 'rgb(191, 191, 191)';
        first.after(new_list)
    }
}

// function get_info(info_panel) {
//     fetch(DataUrl).then(response =>
//         response.json().then(data => ({
//                 data: data,
//                 status: response.status
//             })
//         ).then(res => {
//
//             const team_value = Object.values(res.data.team_info)
//
//             document.getElementById('blue_team_balls').innerText = `${team_value[0].balls_team}`
//             document.getElementById('red_team_balls').innerText = `${team_value[1].balls_team}`
//             document.getElementById('time').innerText = res.data.server_info.gameTime
//
//             info_panel.update_panels(team_value[0].players, team_value[1].players)
//         }).catch(function (e) {
//             console.log(e)
//         }));
// }
//
// function get_objects(info_panel) {
//     fetch(DataUrl).then(response =>
//         response.json().then(data => ({
//                 data: data,
//                 status: response.status
//             })
//         ).then(res => {
//             const team_value = Object.values(res.data.team_info)
//             info_panel.add_panels(team_value[0].players, team_value[1].players)
//         }).catch(function (e) {
//             console.log(e)
//         }));
// }



function rgb_parser(rgb_array) {
    if (rgb_array[0] === 255 && rgb_array[1] === 185 && rgb_array[2] === 0) {
        return 'yellow';
    } else if (rgb_array[0] === 0 && rgb_array[1] === 255 && rgb_array[2] === 0) {
        return 'green';
    } else if (rgb_array[0] === 0 && rgb_array[1] === 0 && rgb_array[2] === 255) {
        return 'blue';
    } else if (rgb_array[0] === 255 && rgb_array[1] === 0 && rgb_array[2] === 0) {
        return 'red';
    } else if (rgb_array[0] === 255 && rgb_array[1] === 102 && rgb_array[2] === 0) {
        return 'orange';
    }
    return '';
}
