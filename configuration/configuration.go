package configuration

import "github.com/ilyakaznacheev/cleanenv"

type (
	Configuration struct {
		Api ApiCfg `json:"apiCfg"`
	}

	ApiCfg struct {
		Host string `yaml:"host" env-default:"localhost"`
		Port string `yaml:"port" env-default:"8080"`
	}

	LoggingCfg struct {
		Level string `yaml:"level" env-default:"debug"`
	}
)

func InitConfiguration(path string) (Configuration, error) {
	var (
		cfg Configuration
	)
	err := cleanenv.ReadConfig(path, &cfg)
	if err != nil {
		return Configuration{}, err
	}
	return cfg, err
}
