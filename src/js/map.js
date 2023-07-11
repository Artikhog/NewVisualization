class Map {
    constructor(id, size, arena_size = 11, zoom = 1.5) {
        this.main_drone_color = ''; // Цвет главного игрока
        this.drones = []; // Массив дронов
        this.map_objects = []; // Массив объектов на карте
        this.scale = size / arena_size;
        this.arena_size = arena_size;
        this.half_arena_size = arena_size / 2;
        this.size = size;
        this.angle = 0; // Угол поворота карты
        this.id = id; // Id главного игрока
        this.map = document.getElementById("map");
        this.map_body = document.getElementById("map_body");
        this.map_background = document.getElementById("map_background");
        this.x = 0; // Позиция, которую показывает карта
        this.y = 0; //
        this.zoom = zoom;
        this.main_player_drone_idx = -1; // Индекс дрона игрока в массиве дронов
        this.main_player_starting_plate_idx = -1; // Индекс стартовой позиции игрока в массиве стартовых позиций
        this.arrow_availabe = false; // Стрелка до стартовой позиции доступна (если существует страртовая позиция)
        this.arrow = ''; // Стрелка до стартовой позиции
        this.big_map = true;
        this.angle_fixer = 0;
        this.arrow_qw_now = -1;
        this.arrow_qw_prev = -1;
        this.init();
    }

    init() { // Инициалищация карты (получение информации обо всех объектах и их отрисовка)
        this.map_background.style.height = this.size + 'px';
        this.map_background.style.width = this.size + 'px';
        this.map_background.style.zoom = this.zoom;

        this.map_body.style.height = this.size + 'px';
        this.map_body.style.width = this.size + 'px';
        this.map_body.style.zoom = this.zoom;

        // const url_map_objects_data = "http://10.10.12.146:31222/game?target=get&type_command=core&command=get_config";
        const url_map_objects_data = "http://127.0.0.1:5555/?target=get&type_command=player&command=config"
        fetch(url_map_objects_data).then(response =>
            response.json().then(data => ({
                    data: data,
                    status: response.status
                })
            ).then(res => {
                var json_polygon_data = res.data.config["Polygon_manager"];
                var json_players_data = res.data.config["Player_manager"];
                var json_drones_data = res.data.config["Robot_manager"];
                this.map_objects.push(new Map_Object("empty", this.scale, 0.25, "none", 0, 0, -1));
                this.map_body.appendChild(this.map_objects[0].draw());
                for (var i = 0; i < Object.keys(json_players_data).length; ++i) {
                    var team_color = json_players_data[i]["color_team"];
                    var players = json_players_data[i]["players"];
                    for (var j = 0; j < players.length; ++j) {
                        var drone_id = players[j]["robot"];
                        var home_id = players[j]["home_object"];
                        var control_object = json_drones_data[drone_id]["control_obj"];
                        if (control_object === "PTZObject") {
                            this.drones.push(new EmptyDrone(control_object, this.scale, team_color, drone_id, true, 0.0));
                            continue;
                        }
                        if (drone_id === this.id) {
                            this.main_player_drone_idx = this.drones.length;
                            this.main_player_starting_plate_idx = home_id;
                            this.drones.push(new Drone(control_object, this.scale, team_color, drone_id, true, 0.25));
                            this.map.appendChild(this.drones[this.drones.length - 1].draw());
                            document.getElementsByClassName("main_player")[0].style.transform = "scale(" + this.zoom + ")";
                        } else {
                            this.drones.push(new Drone(control_object, this.scale, team_color, drone_id, false, 0.25));
                            this.map_body.appendChild(this.drones[this.drones.length - 1].draw());
                        }
                    }
                }

                for (var i = 0; i < Object.keys(json_polygon_data).length; ++i) {
                    var object_type = json_polygon_data[i]["role"];
                    var color = json_polygon_data[i]["vis_info"]["color"];
                    var position = json_polygon_data[i]["position"];

                    switch (object_type) {
                        case "Fabric_RolePolygon":
                            this.map_objects.push(new Factory("factories", this.scale, position[0], position[1], i, color, 0.5))
                            this.map_body.appendChild(this.map_objects[this.map_objects.length - 1].draw())
                            break;
                        case "TakeoffArea_RolePolygon":
                            var number = json_polygon_data[i]["vis_info"]["description"];
                            if (this.main_player_starting_plate_idx === i) {
                                // this.arrow_availabe = true;
                            }
                            this.map_objects.push(new Starting_plate("starting_plates",
                                number, this.scale, position[0], position[1], i, 0.5,
                                color, this.main_player_starting_plate_idx == i))
                            this.map_body.appendChild(this.map_objects[this.map_objects.length - 1].draw())
                            break;
                        case "Weapoint_RolePolygon":
                            this.map_objects.push(new Charger("chargers", this.scale, position[0], position[1], i, color, 0.5))
                            this.map_body.appendChild(this.map_objects[this.map_objects.length - 1].draw());
                            break;
                        default:
                            this.map_objects.push(new Map_Object("empty", this.scale, 0.25, "none", 0, 0, -1));
                            this.map_body.appendChild(this.map_objects[0].draw());
                            break;
                    }
                    this.map_objects[this.map_objects.length - 1].update_position(this);
                }

                this.init_home_arrow();
            }));
        this.set_keyboard_control();
    }
    update_map(config) {
        var players_info = config.players_info;
        var teams = Object.keys(players_info);
        for (var i = 0; i < teams.length; ++i) {
            var ids = Object.keys(players_info[teams[i]]);
            for (var j = 0; j < ids.length; ++j) {
                var id = ids[j];
                var current_drone = players_info[teams[i]][ids[j]]
                var position = current_drone["current_pos"];
                var blocking = current_drone["is_blocking"];
                var is_cargo = current_drone["data_role"]["is_cargo"];
                var cargo_color = current_drone["data_role"]["cargo_color"];
                var is_shooting = current_drone["data_role"]["is_shooting"];
                if (is_cargo) {
                    this.drones[id].change_color_cargo(cargo_color);
                } else {
                    this.drones[id].change_color_cargo("none");
                }
                this.drones[id].make_shot(is_shooting);
                this.drones[id].set_block(blocking);
                this.drones[id].set_position(position);
                this.drones[id].update_position(this.id, this);
                this.follow_main_player(this.main_player_drone_idx);
            }
        }

        var polygon_info = config.polygon_info;
        var ids = Object.keys(polygon_info);
        for(var i = 0; i < ids.length; ++i) {
            var id = Number(ids[i]);
            var object_type = polygon_info[id]["name_role"];
            switch (object_type) {
                case "Fabric_RolePolygon":
                    var cargo_colors = polygon_info[id]["data_role"]["current_cargo_color"];
                    this.map_objects[id + 1].set_cargos(cargo_colors);
                    this.map_objects[id + 1].show_current_cargo(this.angle);
                    break;
                case "TakeoffArea_RolePolygon":

                    break;
                case "Weapoint_RolePolygon":

                    break;
                default:
                    break;
            }
            this.follow_main_player(this.main_player_drone_idx);
        }

        if (this.arrow_availabe) {
            if (this.big_map) {
                this.arrow.style.display = "none";
            } else {
                var pos_starting_plate = this.map_objects[this.main_player_starting_plate_idx + 1].get_position();
                var pos_drone = this.drones[this.main_player_drone_idx].get_position();

                var dist_x = (pos_starting_plate[0] - pos_drone[0]);
                var dist_y = (pos_starting_plate[1] - pos_drone[1]);

                var dist = dist_x ** 2 + dist_y ** 2;
                if(dist >= (2) ** 2) {
                    this.arrow.style.display = "block";
                    var cos_angle = dist_x / Math.sqrt(dist);
                    var sin_angle = dist_y / Math.sqrt(dist);
                    var angle = 0;
                    this.arrow_qw_prev = this.arrow_qw_now;
                    if(pos_drone[1] <= pos_starting_plate[1]) {
                        angle = Math.asin(cos_angle);
                        if(pos_drone[0] <= pos_starting_plate[0]) {
                            this.arrow_qw_now = 1;
                        } else {
                            this.arrow_qw_now = 2;
                        }
                    } else {
                        angle = Math.PI - Math.asin(cos_angle);
                        if(pos_drone[0] <= pos_starting_plate[0]) {
                            this.arrow_qw_now = 3;
                        } else {
                            this.arrow_qw_now = 4;
                        }
                    }
                    if(this.arrow_qw_now !== this.arrow_qw_prev) {
                        if(this.arrow_qw_now === 2 && this.arrow_qw_prev === 4) {
                            this.angle_fixer += 2 * Math.PI;
                        } else if (this.arrow_qw_now === 4 && this.arrow_qw_prev === 2) {
                            this.angle_fixer -= 2 * Math.PI;
                        }
                    }
                    angle += this.angle_fixer;
                    this.arrow.style.rotate = angle + 'rad';
                } else {
                    this.arrow.style.display = "none";
                }
            }
        }
    }
    start_updating_map(interval) { // Прием данных о состоянии дронов и фабрик
        var angle_fixer = 0;
        var arrow_qw_now = -1;
        var arrow_qw_prev = -1;
        setInterval(() => {
            // const get_drones_position = "http://10.10.12.146:31222/game?target=get&type_command=player&command=get_web_info"
            const get_drones_position = "http://127.0.0.1:5555/?target=get&type_command=player&command=game"
            fetch(get_drones_position).then(response =>
                response.json().then(data => ({
                        data: data,
                        status: response.status
                    })
                ).then(res => {
                    // this.follow_main_player(this.main_player_drone_idx);
                    var players_info = res.data.players_info;
                    var teams = Object.keys(players_info);
                    for (var i = 0; i < teams.length; ++i) {
                        var ids = Object.keys(players_info[teams[i]]);
                        for (var j = 0; j < ids.length; ++j) {
                            var id = Number(ids[j]);
                            var current_drone = players_info[teams[i]][ids[j]]
                            var position = current_drone["current_pos"];
                            var blocking = current_drone["is_blocking"];
                            var is_cargo = current_drone["data_role"]["is_cargo"];
                            var cargo_color = current_drone["data_role"]["cargo_color"];
                            var is_shooting = current_drone["data_role"]["is_shooting"];
                            if (is_cargo) {
                                this.drones[id].change_color_cargo(cargo_color);
                            } else {
                                this.drones[id].change_color_cargo("none");
                            }
                            this.drones[id].make_shot(is_shooting);
                            this.drones[id].set_block(blocking);
                            this.drones[id].set_position(position);
                            this.drones[id].update_position(this.id, this);
                            // this.follow_main_player(this.main_player_drone_idx);
                        }
                    }

                    var polygon_info = res.data.polygon_info;
                    var ids = Object.keys(polygon_info);
                    for(var i = 0; i < ids.length; ++i) {
                        var id = Number(ids[i]);
                        var object_type = polygon_info[id]["name_role"];
                        switch (object_type) {
                            case "Fabric_RolePolygon":
                                var cargo_colors = polygon_info[id]["data_role"]["current_cargo_color"];
                                this.map_objects[id + 1].set_cargos(cargo_colors);
                                this.map_objects[id + 1].show_current_cargo();
                                break;
                            case "TakeoffArea_RolePolygon":

                                break;
                            case "Weapoint_RolePolygon":

                                break;
                            default:
                                break;
                        }
                        this.follow_main_player(this.main_player_drone_idx);
                    }

                    if (this.arrow_availabe) {
                        if (this.big_map) {
                            this.arrow.style.display = "none";
                        } else {
                            var pos_starting_plate = this.map_objects[this.main_player_starting_plate_idx + 1].get_position();
                            var pos_drone = this.drones[this.main_player_drone_idx].get_position();

                            var dist_x = (pos_starting_plate[0] - pos_drone[0]);
                            var dist_y = (pos_starting_plate[1] - pos_drone[1]);

                            var dist = dist_x ** 2 + dist_y ** 2;
                            if(dist >= (2) ** 2) {
                                this.arrow.style.display = "block";
                                var cos_angle = dist_x / Math.sqrt(dist);
                                var sin_angle = dist_y / Math.sqrt(dist);
                                var angle = 0;
                                arrow_qw_prev = arrow_qw_now;
                                if(pos_drone[1] <= pos_starting_plate[1]) {
                                    angle = Math.asin(cos_angle);
                                    if(pos_drone[0] <= pos_starting_plate[0]) {
                                        arrow_qw_now = 1;
                                    } else {
                                        arrow_qw_now = 2;
                                    }
                                } else {
                                    angle = Math.PI - Math.asin(cos_angle);
                                    if(pos_drone[0] <= pos_starting_plate[0]) {
                                        arrow_qw_now = 3;
                                    } else {
                                        arrow_qw_now = 4;
                                    }
                                }
                                if(arrow_qw_now !== arrow_qw_prev) {
                                    if(arrow_qw_now === 2 && arrow_qw_prev === 4) {
                                        angle_fixer += 2 * Math.PI;
                                    } else if (arrow_qw_now === 4 && arrow_qw_prev === 2) {
                                        angle_fixer -= 2 * Math.PI;
                                    }
                                }
                                angle += angle_fixer;
                                this.arrow.style.rotate = angle + 'rad';
                            } else {
                                this.arrow.style.display = "none";
                            }
                        }
                    }
                }))
        }, interval);
    }

    init_home_arrow() { // Начальная отрисовка стрелки, если доступна
        if (this.arrow_availabe) {
            var arrow_sample = document.getElementById("arrow");
            var new_arrow_img = arrow_sample.cloneNode(true);
            new_arrow_img.removeAttribute("id");
            new_arrow_img.classList.remove("sample");
            new_arrow_img.classList.add("arrow");
            this.arrow = new_arrow_img;
            this.map.appendChild(this.arrow);
        }
    }

    follow_main_player(id) { // Карта центруется на главном игроке
        var drone_pos = this.drones[id].get_position();

        // this.angle = drone_pos[2];
        this.x = drone_pos[0];
        this.y = drone_pos[1];

        var half_map_height = this.map.offsetHeight / 2;
        var half_map_width = this.map.offsetWidth / 2;

        var pos_x = map(-this.x, -this.half_arena_size, this.half_arena_size, 0, this.size) - this.size + half_map_width / this.zoom// - this.size;
        var pos_y = map(this.y, -this.half_arena_size, this.half_arena_size, 0, this.size) - this.size + half_map_height / this.zoom// - this.size;

        if(!this.big_map) {
            this.map.style.opacity = '1';
            this.map.style.rotate = -this.angle + 'rad';
            this.map.style.top = '0px';
            this.map.style.left = '0px';

            this.map_background.style.left = pos_x + 'px';
            this.map_background.style.top = pos_y + 'px';

            this.map_body.style.left = pos_x + 'px';
            this.map_body.style.top = pos_y + 'px';
        } else {
            this.map.style.borderRadius = '0%';
            this.map.style.width = 1100 * this.zoom + "px";
            this.map.style.height = 1100 * this.zoom + "px";

            this.map_background.style.top = "0px";
            this.map_background.style.left = "0px";
            this.map_background.style.rotate = "0rad";

            this.map_body.style.top = "0px";
            this.map_body.style.left = "0px";
            this.map_body.style.rotate = "0rad";

            this.map.style.rotate = this.angle + 'deg';
            this.map.style.top = 'calc(-1292px + ' + (2160 - this.size * this.zoom) / 2 + 'px)';
            this.map.style.left = 'calc(-2972px + ' + (3840 - this.size * this.zoom) / 2 + 'px)';

            this.map_background.style.left = 0 + 'px';
            this.map_background.style.top = 0 + 'px';
        }

    }

    set_keyboard_control() { // Управление главным игроком (для тестов)
        document.addEventListener("keydown", (e) => {
            // if (e.keyCode === 77) {
            //     this.big_map = !this.big_map;
            //     if(this.big_map) {
            //         this.map.style.borderRadius = '0%';
            //         this.map.style.width = 1100 * this.zoom + "px";
            //         this.map.style.height = 1100 * this.zoom + "px";
            //
            //         this.map_background.style.top = "0px";
            //         this.map_background.style.left = "0px";
            //         this.map_background.style.rotate = "0rad";
            //
            //         this.map_body.style.top = "0px";
            //         this.map_body.style.left = "0px";
            //         this.map_body.style.rotate = "0rad";
            //     } else {
            //         this.map.style.borderRadius = '100%';
            //         this.map.style.width = "648px";
            //         this.map.style.height = "648px";
            //     }
            // }
            if (e.keyCode === 69) {
                this.angle += 90;
            }
            if (e.keyCode === 81) {
                this.angle -= 90;
            }
            console.log("KEYCODE", e.keyCode, this.angle)
        });
    }
}

class Map_Object {
    constructor(type, map_scale, scale_k, color, x, y, id) {
        this.x = x; // Позиция объекта
        this.y = y;
        this.angle = 0; // Угол объекта
        this.type = type; // Имя объекта (id тега с картинкой)
        this.color = 'rgb(' + color.toString() + ')'; // Цвет объекта
        this.map_scale = map_scale;
        this.scale_k = scale_k; // Масштаб
        this.object_model = document.getElementById("empty");
        this.id = id;
    }

    change_color(color) { // Изменение цвета объекта
        for (var i = 0; i < this.object_model.children[0].children.length; ++i) {
            this.object_model.children[0].children[i].setAttribute("fill", color);
        }
        return this.object_model;
    }

    draw() { // Возврат тега, содержащего картинку объекта
        return this.object_model;
    }

    update_position(map_pos) { // Обновление позиции на карте
        var obj_pos_x = map(this.x, -map_pos.half_arena_size, map_pos.half_arena_size, 0, map_pos.size) - this.object_model.offsetWidth / 2;
        var obj_pos_y = map(-this.y, -map_pos.half_arena_size, map_pos.half_arena_size, 0, map_pos.size) - this.object_model.offsetHeight / 2;

        this.object_model.style.top = obj_pos_y + 'px';
        this.object_model.style.left = obj_pos_x + 'px';
        this.object_model.style.rotate = this.angle + 'rad';
    }

    get_position() { // Получение позиции
        var y = this.y;
        var x = this.x;
        var angle = this.angle;
        return [x, y, angle];
    }

}

class EmptyDrone extends Map_Object {
    constructor(type, map_scale, color, id, main_player = false, scale_k = 0.5, dop_angle=-90) {
        super(type, map_scale, scale_k, color, 0, 0, id);
        this.dop_angle = dop_angle;
        this.blocking = -1;
        this.cargo_color = '';
        this.cargo = '';
        this.main_player = main_player;
        this.make_object(this.type);
    }
    make_object(name_of_sample) {
        return;
    }
    update_position(id, map_pos) {
        return;
    }
    make_shot(is_shooting) {
        return;
    }
    set_block(blocking) {
        return;
    }
    change_color_cargo(color) {
        return;
    }
    set_position(pos) {
        return;
    }
    add_position(x, y, angle) {
        return;
    }
}

class Drone extends Map_Object { // Класс дрона / робота
    constructor(type, map_scale, color, id, main_player = false, scale_k = 0.5, dop_angle=-90) {
        super(type, map_scale, scale_k, color, 0, 0, id);
        this.dop_angle = dop_angle;
        this.blocking = -1;
        this.cargo_color = '';
        this.cargo = '';
        this.main_player = main_player;
        this.angle_fixer = 0;
        this.anti_rotation = 0;
        this.make_object(this.type);
    }

    make_object(name_of_sample) { // Создание картинки дрона / робота и груза
        // Получение шаблона дрона/робота
        var drone_sample = document.getElementById(name_of_sample);
        var new_drone_img = drone_sample.cloneNode(true);
        new_drone_img.removeAttribute("id");
        new_drone_img.classList.remove("sample");
        new_drone_img.classList.add("drone");
        if (this.main_player) {
            new_drone_img.classList.add("main_player");
        }
        if (name_of_sample === "EduBotObject") {
            this.angle_fixer = Math.PI / 2;
        }

        // Получение шаблона груза
        var cargo_sample = document.getElementById("cargo_box");
        var new_cargo_img = cargo_sample.cloneNode(true);
        new_cargo_img.removeAttribute("id");
        new_cargo_img.classList.remove("sample");
        new_cargo_img.classList.add("cargo");

        // Масштабирование шаблона груза
        var current_height = new_cargo_img.children[0].getAttribute("height") * this.scale_k;
        var current_width = new_cargo_img.children[0].getAttribute("width") * this.scale_k;
        new_cargo_img.style.height = current_height + 'px';
        new_cargo_img.style.width = current_width + 'px';
        new_cargo_img.style.top = '95%';
        new_cargo_img.style.left = 'calc(50% - ' + Math.round(current_width / 2) + 'px)';
        new_cargo_img.children[0].setAttribute("height", current_height);
        new_cargo_img.children[0].setAttribute("width", current_width);
        this.cargo = new_cargo_img;
        this.change_color_cargo('none');
        new_drone_img.appendChild(new_cargo_img);

        // Масштабирование шаблона дрона/робота
        current_height = new_drone_img.children[0].getAttribute("height") * this.scale_k;
        current_width = new_drone_img.children[0].getAttribute("width") * this.scale_k;
        new_drone_img.style.height = current_height + 'px';
        new_drone_img.style.width = current_width + 'px';
        new_drone_img.children[0].setAttribute("height", current_height);
        new_drone_img.children[0].setAttribute("width", current_width);
        new_drone_img.children[1].style.top = "calc(50% - " + Math.round((current_height + 40) / 2 - 1) + "px)";
        new_drone_img.children[1].style.left = "calc(50%  - " + Math.round((current_width + 40) / 2 - 1) + "px)";
        new_drone_img.children[1].style.width = current_width + 40 + "px";
        new_drone_img.children[1].style.height = current_height + 40 + "px";
        this.object_model = new_drone_img;
        this.change_color(this.color);
    }

    update_position(id, map_pos) { // Обновление позиции дронов (если дрон, управляемый игроком, то ставим его в центр карты)
        // if (this.type === 'PioneerObject') {
        //     var sun_center = [0, 0];
        //     var dist = Math.sqrt((sun_center[0] - this.x) ** 2 + (sun_center[1] - this.y) ** 2);
        //     var sin_angle = (this.y - sun_center[1]) / dist;
        //     var cos_angle = (this.x - sun_center[0]) / dist;
        //
        //     var shadow_x = 1.5 * dist * Math.cos(Math.acos(cos_angle) + this.angle * (sin_angle > 0 ? 1 : -1));
        //     var shadow_y = -1.5 * dist * Math.sin(Math.asin(sin_angle) + this.angle * (cos_angle > 0 ? 1 : -1));
        //
        //     this.object_model.style.filter = "drop-shadow(" + shadow_x + "px " + shadow_y + "px 4px black)";
        // }
        if (id === this.id) {
            if (!map_pos.big_map) {
                this.object_model.style.rotate = this.angle + 'rad';
                this.object_model.style.top = map_pos.map.offsetHeight / 2 - this.object_model.offsetHeight / 2 + 'px';
                this.object_model.style.left = map_pos.map.offsetWidth / 2 - this.object_model.offsetWidth / 2 + 'px';
                return;
            }
            var obj_pos_x = map(this.x, -map_pos.half_arena_size, map_pos.half_arena_size, 0, map_pos.size * map_pos.zoom) - this.object_model.offsetWidth / 2;
            var obj_pos_y = map(-this.y, -map_pos.half_arena_size, map_pos.half_arena_size, 0, map_pos.size * map_pos.zoom) - this.object_model.offsetHeight / 2;

            this.object_model.style.top = obj_pos_y + 'px';
            this.object_model.style.left = obj_pos_x + 'px';
            this.object_model.style.rotate = this.angle + 'rad';
            return;
        }

        var obj_pos_x = map(this.x, -map_pos.half_arena_size, map_pos.half_arena_size, 0, map_pos.size) - this.object_model.offsetWidth / 2;
        var obj_pos_y = map(-this.y, -map_pos.half_arena_size, map_pos.half_arena_size, 0, map_pos.size) - this.object_model.offsetHeight / 2;

        this.object_model.style.top = obj_pos_y + 'px';
        this.object_model.style.left = obj_pos_x + 'px';
        this.object_model.style.rotate = this.angle + 'rad';
    }

    make_shot(is_shooting) { // Отрисовка выстрела
        // this.object_model.children[1].style.animationPlayState = "running";
        if (is_shooting) {
            const min_scale = 1.15;
            const max_scale = 4;
            this.object_model.children[1].style.scale = min_scale;
            var anim_idx = setInterval(() => {
                var angle = Math.random() * (Math.PI + Math.PI) - Math.PI;
                // var scale = Math.random() * (max_scale - min_scale) + min_scale;
                // this.object_model.children[1].style.scale = scale;
                // this.object_model.children[1].style.scale = 1;
                this.object_model.children[1].style.rotate = angle * 100 + 'rad';
            }, 100)
        } else {
            clearInterval(anim_idx);
            this.object_model.children[1].style.scale = '0';
        }
    }

    set_block(blocking) {
        if (blocking) {
            if (this.blocking === -1) {
                this.object_model.style.transitionDuration = "0.2s";
                this.blocking = setInterval(() => {
                    this.object_model.style.opacity = "0.6";
                    setTimeout(() => {
                        this.object_model.style.opacity = "1";
                    }, 500);
                }, 1000)
            }
        } else {
            if (this.blocking !== -1) {
                clearInterval(this.blocking);
                this.blocking = -1;
            }
        }
    }

    change_color_cargo(color) { // Изменение цвета груза
        if (color === 'none') {
            this.cargo.style.scale = '0';
            return;
        }
        for (var i = 0; i < this.cargo.children[0].children.length; ++i) {
            this.cargo.children[0].children[i].setAttribute("fill", "rgb(" + color.toString() + ")");
        }
        this.cargo.style.scale = '1.6';
    }

    set_position(pos) { // Установить заданную позицию
        var new_angle = -pos[3] - this.angle_fixer;
        if (new_angle - (this.angle - 2 * Math.PI * this.anti_rotation) < -3 * Math.PI / 4) {
            this.anti_rotation += 1;
        } else if (new_angle - (this.angle - 2 * Math.PI * this.anti_rotation) > 3 * Math.PI / 4) {
            this.anti_rotation -= 1;
        }
        this.angle = new_angle + 2 * Math.PI * this.anti_rotation;
        this.x = constrain(pos[0], -5.5, 5.5);
        this.y = constrain(pos[1], -5.5, 5.5);
    }

    add_position(x, y, angle) { // Изменить текущую позицию
        this.angle += angle;
        this.x += x;
        this.y += y;

        this.x = constrain(this.x, -5.5, 5.5);
        this.y = constrain(this.y, -5.5, 5.5);
    }
}

class Charger extends Map_Object {
    constructor(type, map_scale, x, y, id, color, scale_k = 0.5, dop_angle=-90) {
        super(type, map_scale, scale_k, color, x, y, id);
        this.make_object(this.type);
    }
    make_object(name_of_sample) {
        var charger_sample = document.getElementById(name_of_sample);
        var new_charger_img = charger_sample.cloneNode(true);
        new_charger_img.removeAttribute("id");
        new_charger_img.classList.remove("sample");
        new_charger_img.classList.add("charger");
        var current_height = new_charger_img.children[0].getAttribute("height") * this.scale_k;
        var current_width = new_charger_img.children[0].getAttribute("width") * this.scale_k;
        new_charger_img.style.height = current_height + 'px';
        new_charger_img.style.width = current_width + 'px';
        new_charger_img.children[0].setAttribute("height", current_height);
        new_charger_img.children[0].setAttribute("width", current_width);
        this.object_model = new_charger_img;
        this.change_color(this.color);
    }
}

class Factory extends Map_Object {
    constructor(type, map_scale, x, y, id, color, scale_k = 0.5, dop_angle=-90) {
        super(type, map_scale, scale_k, color, x, y, id);
        this.cargo = '';
        this.cargo_colors = [];
        this.make_object(this.type);
    }
    make_object(name_of_sample) {
        var factory_sample = document.getElementById(name_of_sample);
        var new_factory_img = factory_sample.cloneNode(true);
        new_factory_img.removeAttribute("id");
        new_factory_img.classList.remove("sample");
        new_factory_img.classList.add("factory");
        var current_height = new_factory_img.children[0].getAttribute("height") * this.scale_k;
        var current_width = new_factory_img.children[0].getAttribute("width") * this.scale_k;
        new_factory_img.style.height = current_height + 'px';
        new_factory_img.style.width = current_width + 'px';
        new_factory_img.children[0].setAttribute("height", current_height);
        new_factory_img.children[0].setAttribute("width", current_width);

        // Получение шаблона груза
        var cargo_sample = document.getElementById("cargo_box");
        var new_cargo_img = cargo_sample.cloneNode(true);
        new_cargo_img.removeAttribute("id");
        new_cargo_img.classList.remove("sample");
        new_cargo_img.classList.add("cargo_factory");

        // Масштабирование шаблона груза
        var current_height = new_cargo_img.children[0].getAttribute("height") * this.scale_k;
        var current_width = new_cargo_img.children[0].getAttribute("width") * this.scale_k;
        new_cargo_img.style.height = current_height + 'px';
        new_cargo_img.style.width = current_width + 'px';
        new_cargo_img.style.top = 'calc(50% - ' + current_height / 2 + 'px)';
        new_cargo_img.style.left = 'calc(50% - ' + current_width / 2 + 'px)';
        new_cargo_img.children[0].setAttribute("height", current_height);
        new_cargo_img.children[0].setAttribute("width", current_width);
        this.cargo = new_cargo_img;
        this.change_color_cargo('none');
        new_factory_img.appendChild(new_cargo_img);

        this.object_model = new_factory_img;
        this.change_color(this.color);
    }
    set_cargos(colors) {
        this.cargo_colors = colors;
    }
    show_current_cargo(angle) {
        if (this.cargo_colors.length > 0) {
            this.cargo.style.rotate = angle + "rad";
            this.change_color_cargo(this.cargo_colors[0]);
        } else {
            this.change_color_cargo("none");
        }
    }
    change_color_cargo(color) { // Изменение цвета груза
        if (color === 'none') {
            this.cargo.style.animationPlayState = "paused";
            this.cargo.hidden = true;
            return;
        }
        for (var i = 0; i < this.cargo.children[0].children.length; ++i) {
            this.cargo.children[0].children[i].setAttribute("fill", "rgb(" + color.toString() + ")");
        }
        this.cargo.style.animationPlayState = "running";
        this.cargo.hidden = false;

    }
}

class Starting_plate extends Map_Object {
    constructor(type, number, map_scale, x, y, id, scale_k = 0.5, color, main_player_start = false, dop_angle=-90) {
        super(type, map_scale, scale_k, color, x, y, id);
        this.number = number;
        this.main_player_start = main_player_start
        this.origin_font_size = 110;
        this.make_object(this.type);
    }
    make_object(name_of_sample) {
        var starting_plate_sample = document.getElementById(name_of_sample);
        var new_starting_plate_img = starting_plate_sample.cloneNode(true);
        new_starting_plate_img.removeAttribute("id");
        new_starting_plate_img.classList.remove("sample");
        new_starting_plate_img.classList.add("starting_plate");
        var current_height = new_starting_plate_img.children[0].getAttribute("height") * this.scale_k;
        var current_width = new_starting_plate_img.children[0].getAttribute("width") * this.scale_k;

        new_starting_plate_img.style.height = current_height + 'px';
        new_starting_plate_img.style.width = current_width + 'px';
        new_starting_plate_img.children[0].setAttribute("height", current_height);
        new_starting_plate_img.children[0].setAttribute("width", current_width);

        new_starting_plate_img.children[1].innerHTML = this.number;
        new_starting_plate_img.children[1].style.fontSize = this.origin_font_size * this.scale_k + 'px';
        var actual_span_h_width = this.origin_font_size * this.scale_k / 1.797591227754809 / 2;
        new_starting_plate_img.children[1].style.top = "calc(50% - 12px)";// + new_starting_plate_img.children[1].offsetHeight / 2 + "px)";
        new_starting_plate_img.children[1].style.left = "0px";
        new_starting_plate_img.children[1].style.width = "100%";
        new_starting_plate_img.children[1].style.textAlign = "center";

        if (this.main_player_start) {
            var home_mark_sample = document.getElementById("home_mark");
            var new_home_mark_img = home_mark_sample.cloneNode(true);
            new_home_mark_img.removeAttribute("id");
            new_home_mark_img.classList.remove("sample");
            new_home_mark_img.classList.add("home_mark");
            current_height = new_home_mark_img.children[0].getAttribute("height") * this.scale_k;
            current_width = new_home_mark_img.children[0].getAttribute("width") * this.scale_k;
            new_home_mark_img.style.height = current_height + 'px';
            new_home_mark_img.style.width = current_width + 'px';
            new_home_mark_img.children[0].setAttribute("height", current_height);
            new_home_mark_img.children[0].setAttribute("width", current_width);
            new_home_mark_img.style.top = "calc(50% - " + current_height / 2 + "px";
            new_home_mark_img.style.left = "calc(50% - " + current_width / 2 + "px";
            for (var i = 0; i < new_home_mark_img.children[0].children.length; ++i) {
                new_home_mark_img.children[0].children[i].setAttribute("fill", this.color);
            }
            new_starting_plate_img.appendChild(new_home_mark_img);
        }
        this.object_model = new_starting_plate_img;
        this.change_color(this.color);
    }
}

function map(value, in_min, in_max, out_min, out_max) { // Перевод из одного интрвала в другой
    return (value - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

function constrain(value, min, max) { // Обреззание переполнения
    if (value < min)
        return min;
    if (value > max)
        return max;
    return value;
}

function cut_angle(angle, min_angle, max_angle) {
    while(angle > max_angle) {
        angle -= 2 * Math.PI;
    }
    while(angle < min_angle) {
        angle += 2 * Math.PI;
    }
    return angle;
}

class Bonus { // Класс отображения бонусов на мини-карте (lifetime не исопльзуется)
    constructor(type, x = 0, y = 0, lifetime = 10, scale_k) {
        this.x = x;
        this.y = y;
        this.lifetime = lifetime;
        this.type = type;
        this.scale_k = scale_k;
        this.make_object();
    }

    make_object() {
        var bonus_sample = document.getElementById(this.type);
        var new_bonus_img = bonus_sample.cloneNode(true);
        new_bonus_img.removeAttribute("id");
        new_bonus_img.classList.remove("sample");
        new_bonus_img.classList.add(this.type);
        var current_height = 170 * this.scale_k;
        var current_width = 170 * this.scale_k;
        new_bonus_img.style.height = current_height + 'px';
        new_bonus_img.style.width = current_width + 'px';
        this.object_model = new_bonus_img;
        // console.log(this.object_model)
    }

    draw() { // Возврат тега, содержащего картинку объекта
        return this.object_model;
    }

    update_position(map_pos) { // Обновление позиции на карте
        var obj_pos_x = map(this.x, -map_pos.half_arena_size, map_pos.half_arena_size, 0, map_pos.size) - this.object_model.offsetWidth / 2;
        var obj_pos_y = map(-this.y, -map_pos.half_arena_size, map_pos.half_arena_size, 0, map_pos.size) - this.object_model.offsetHeight / 2;

        this.object_model.style.top = obj_pos_y + 'px';
        this.object_model.style.left = obj_pos_x + 'px';
        this.object_model.style.rotate = this.angle + 'rad';
    }
}  