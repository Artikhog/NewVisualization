function get_commands_url(get_config_url, get_web_info_url, get_visualization_url) {
    let config_data = 0
    fetch("/src/js/config.json").then(response => response.json())
        .then(data => {
            config_data = data
            console.log(config_data.ip + config_data.get_game_config_command)
            console.log(config_data.ip + config_data.get_wed_info_command)
            console.log(config_data.ip + config_data.get_visualization_command)

            get_config_url = config_data.ip + config_data.get_game_config_command
            get_web_info_url = config_data.ip + config_data.get_wed_info_command
            get_visualization_url = config_data.ip + config_data.get_visualization_command


        }) .catch(error =>
        console.error('Ошибка при загрузке JSON-файла:', error)
    );
}