-- Add description_ru column for Russian descriptions
ALTER TABLE metrics_configuration ADD COLUMN IF NOT EXISTS description_ru TEXT;

-- Add threshold columns for alerting
ALTER TABLE metrics_configuration ADD COLUMN IF NOT EXISTS threshold_critical TEXT;
ALTER TABLE metrics_configuration ADD COLUMN IF NOT EXISTS threshold_warning TEXT;

-- Update Radio Quality Metrics (Group 1)
UPDATE metrics_configuration SET 
    description_ru = 'Принятая мощность опорного сигнала - средняя мощность принимаемого сигнала',
    threshold_critical = '< -120',
    threshold_warning = '< -110'
WHERE name = 'RSRP';

UPDATE metrics_configuration SET 
    description_ru = 'Качество принятого опорного сигнала - отношение сигнал/помеха',
    threshold_critical = '< -20',
    threshold_warning = '< -15'
WHERE name = 'RSRQ';

UPDATE metrics_configuration SET 
    description_ru = 'Индикатор уровня принятого сигнала - общая мощность принимаемого сигнала',
    threshold_critical = '< -105',
    threshold_warning = '< -95'
WHERE name = 'RSSI';

UPDATE metrics_configuration SET 
    description_ru = 'Отношение сигнал/(помеха+шум) - качество радиоканала',
    threshold_critical = '< -3',
    threshold_warning = '< 5'
WHERE name = 'SINR';

UPDATE metrics_configuration SET 
    description_ru = 'Индикатор качества канала - оценка качества нисходящего канала',
    threshold_critical = '< 3',
    threshold_warning = '< 5'
WHERE name = 'CQI';

UPDATE metrics_configuration SET 
    description_ru = 'Коэффициент ошибок блока - процент ошибочных блоков',
    threshold_critical = '> 10',
    threshold_warning = '> 5'
WHERE name = 'BLER';

-- Update Throughput Metrics (Group 2)
UPDATE metrics_configuration SET 
    description_ru = 'Пропускная способность нисходящего канала',
    threshold_critical = '< 5',
    threshold_warning = '< 10'
WHERE name = 'DL_Throughput';

UPDATE metrics_configuration SET 
    description_ru = 'Пропускная способность восходящего канала',
    threshold_critical = '< 2',
    threshold_warning = '< 5'
WHERE name = 'UL_Throughput';

UPDATE metrics_configuration SET 
    description_ru = 'Использование физических ресурсных блоков в нисходящем канале',
    threshold_critical = '> 95',
    threshold_warning = '> 85'
WHERE name = 'PRB_Utilization_DL';

UPDATE metrics_configuration SET 
    description_ru = 'Использование физических ресурсных блоков в восходящем канале',
    threshold_critical = '> 95',
    threshold_warning = '> 85'
WHERE name = 'PRB_Utilization_UL';

UPDATE metrics_configuration SET 
    description_ru = 'Общая пропускная способность соты',
    threshold_critical = '< 50',
    threshold_warning = '< 100'
WHERE name = 'Cell_Throughput';

UPDATE metrics_configuration SET 
    description_ru = 'Средняя пропускная способность пользователя',
    threshold_critical = '< 1',
    threshold_warning = '< 5'
WHERE name = 'User_Throughput_Mean';

-- Update Latency Metrics (Group 3)
UPDATE metrics_configuration SET 
    description_ru = 'Задержка в сети',
    threshold_critical = '> 100',
    threshold_warning = '> 50'
WHERE name = 'Latency';

UPDATE metrics_configuration SET 
    description_ru = 'Джиттер - вариация задержки пакетов',
    threshold_critical = '> 50',
    threshold_warning = '> 30'
WHERE name = 'Jitter';

UPDATE metrics_configuration SET 
    description_ru = 'Время приема-передачи сигнала туда и обратно',
    threshold_critical = '> 150',
    threshold_warning = '> 100'
WHERE name = 'RTT';

UPDATE metrics_configuration SET 
    description_ru = 'Задержка пакета в сети',
    threshold_critical = '> 100',
    threshold_warning = '> 50'
WHERE name = 'Packet_Delay';

-- Update Call/Session Quality Metrics (Group 4)
UPDATE metrics_configuration SET 
    description_ru = 'Коэффициент прерванных вызовов',
    threshold_critical = '> 2',
    threshold_warning = '> 1'
WHERE name = 'Call_Drop_Rate';

UPDATE metrics_configuration SET 
    description_ru = 'Успешность хэндовера',
    threshold_critical = '< 95',
    threshold_warning = '< 98'
WHERE name = 'Handover_Success_Rate';

UPDATE metrics_configuration SET 
    description_ru = 'Успешность установки RRC соединения',
    threshold_critical = '< 95',
    threshold_warning = '< 98'
WHERE name = 'RRC_Connection_Success_Rate';

UPDATE metrics_configuration SET 
    description_ru = 'Коэффициент потерянных пакетов',
    threshold_critical = '> 5',
    threshold_warning = '> 2'
WHERE name = 'Packet_Loss_Rate';

UPDATE metrics_configuration SET 
    description_ru = 'Успешность установки RAB канала',
    threshold_critical = '< 95',
    threshold_warning = '< 98'
WHERE name = 'RAB_Setup_Success_Rate';

UPDATE metrics_configuration SET 
    description_ru = 'Успешность установки E-UTRAN Radio Access Bearer',
    threshold_critical = '< 95',
    threshold_warning = '< 98'
WHERE name = 'ERAB_Setup_Success_Rate';

-- Update 5G Specific Metrics (Group 5)
UPDATE metrics_configuration SET 
    description_ru = 'Мощность опорного сигнала синхронизации (5G NR)',
    threshold_critical = '< -120',
    threshold_warning = '< -110'
WHERE name = 'SS-RSRP';

UPDATE metrics_configuration SET 
    description_ru = 'Качество опорного сигнала синхронизации (5G NR)',
    threshold_critical = '< -20',
    threshold_warning = '< -15'
WHERE name = 'SS-RSRQ';

UPDATE metrics_configuration SET 
    description_ru = 'Отношение сигнал/(помеха+шум) для сигнала синхронизации (5G NR)',
    threshold_critical = '< -3',
    threshold_warning = '< 5'
WHERE name = 'SS-SINR';

UPDATE metrics_configuration SET 
    description_ru = 'Мощность опорного сигнала информации о состоянии канала (5G NR)',
    threshold_critical = '< -120',
    threshold_warning = '< -110'
WHERE name = 'CSI-RSRP';

UPDATE metrics_configuration SET 
    description_ru = 'Качество опорного сигнала информации о состоянии канала (5G NR)',
    threshold_critical = '< -20',
    threshold_warning = '< -15'
WHERE name = 'CSI-RSRQ';

UPDATE metrics_configuration SET 
    description_ru = 'Отношение сигнал/(помеха+шум) для CSI (5G NR)',
    threshold_critical = '< -3',
    threshold_warning = '< 5'
WHERE name = 'CSI-SINR';

-- Update Network Performance Metrics (Group 6)
UPDATE metrics_configuration SET 
    description_ru = 'Количество активных пользователей',
    threshold_critical = '> 10000',
    threshold_warning = '> 8000'
WHERE name = 'Active_Users';

UPDATE metrics_configuration SET 
    description_ru = 'Количество пользователей с установленным RRC соединением',
    threshold_critical = '> 5000',
    threshold_warning = '> 4000'
WHERE name = 'RRC_Connected_Users';

UPDATE metrics_configuration SET 
    description_ru = 'Спектральная эффективность - бит/с/Гц',
    threshold_critical = '< 0.5',
    threshold_warning = '< 1.0'
WHERE name = 'Spectral_Efficiency';

UPDATE metrics_configuration SET 
    description_ru = 'Доступность соты',
    threshold_critical = '< 95',
    threshold_warning = '< 98'
WHERE name = 'Cell_Availability';

UPDATE metrics_configuration SET 
    description_ru = 'Уровень помех в сети',
    threshold_critical = '> -80',
    threshold_warning = '> -90'
WHERE name = 'Interference_Level';

UPDATE metrics_configuration SET 
    description_ru = 'Коэффициент повторных передач',
    threshold_critical = '> 20',
    threshold_warning = '> 10'
WHERE name = 'Retransmission_Rate';

-- Update Accessibility Metrics (Group 7)
UPDATE metrics_configuration SET 
    description_ru = 'Успешность установки RRC соединения',
    threshold_critical = '< 95',
    threshold_warning = '< 98'
WHERE name = 'RRC_Setup_Success_Rate';

UPDATE metrics_configuration SET 
    description_ru = 'Коэффициент неудачных попыток установки RRC',
    threshold_critical = '> 5',
    threshold_warning = '> 2'
WHERE name = 'RRC_Setup_Failure_Rate';

UPDATE metrics_configuration SET 
    description_ru = 'Количество попыток установки RRC соединения',
    threshold_critical = '> 10000',
    threshold_warning = '> 8000'
WHERE name = 'RRC_Setup_Attempts';

UPDATE metrics_configuration SET 
    description_ru = 'Успешность процедуры случайного доступа',
    threshold_critical = '< 94',
    threshold_warning = '< 96'
WHERE name = 'RACH_Success_Rate';

UPDATE metrics_configuration SET 
    description_ru = 'Количество попыток передачи преамбулы RACH',
    threshold_critical = '> 20000',
    threshold_warning = '> 15000'
WHERE name = 'RACH_Preamble_Attempts';

UPDATE metrics_configuration SET 
    description_ru = 'Успешность установки S1 соединения',
    threshold_critical = '< 95',
    threshold_warning = '< 98'
WHERE name = 'S1_Setup_Success_Rate';

UPDATE metrics_configuration SET 
    description_ru = 'Успешность установки начального контекста',
    threshold_critical = '< 95',
    threshold_warning = '< 98'
WHERE name = 'Initial_Context_Setup_Success_Rate';

UPDATE metrics_configuration SET 
    description_ru = 'Успешность обработки запроса на обслуживание',
    threshold_critical = '< 95',
    threshold_warning = '< 98'
WHERE name = 'Service_Request_Success_Rate';

UPDATE metrics_configuration SET 
    description_ru = 'Успешность процедуры присоединения к сети',
    threshold_critical = '< 95',
    threshold_warning = '< 98'
WHERE name = 'Attach_Success_Rate';

UPDATE metrics_configuration SET 
    description_ru = 'Успешность установки PDN соединения',
    threshold_critical = '< 95',
    threshold_warning = '< 98'
WHERE name = 'PDN_Connection_Success_Rate';

-- Update Retainability Metrics (Group 8)
UPDATE metrics_configuration SET 
    description_ru = 'Коэффициент аварийного разрыва RRC соединения',
    threshold_critical = '> 3',
    threshold_warning = '> 1.5'
WHERE name = 'RRC_Connection_Abnormal_Release_Rate';

UPDATE metrics_configuration SET 
    description_ru = 'Коэффициент аварийного разрыва ERAB',
    threshold_critical = '> 3',
    threshold_warning = '> 1.5'
WHERE name = 'ERAB_Abnormal_Release_Rate';

UPDATE metrics_configuration SET 
    description_ru = 'Коэффициент прерванных сессий',
    threshold_critical = '> 2',
    threshold_warning = '> 1'
WHERE name = 'Session_Drop_Rate';

UPDATE metrics_configuration SET 
    description_ru = 'Коэффициент освобождения контекста UE',
    threshold_critical = '> 5',
    threshold_warning = '> 3'
WHERE name = 'UE_Context_Release_Rate';

UPDATE metrics_configuration SET 
    description_ru = 'Коэффициент отказов радиосоединения',
    threshold_critical = '> 2',
    threshold_warning = '> 1'
WHERE name = 'Radio_Link_Failure_Rate';

UPDATE metrics_configuration SET 
    description_ru = 'Коэффициент удержания соединения',
    threshold_critical = '< 95',
    threshold_warning = '< 98'
WHERE name = 'Connection_Retention_Rate';

UPDATE metrics_configuration SET 
    description_ru = 'Среднее время между отказами',
    threshold_critical = '< 3600',
    threshold_warning = '< 7200'
WHERE name = 'Mean_Time_Between_Failures';

-- Update Mobility Metrics (Group 9)
UPDATE metrics_configuration SET 
    description_ru = 'Успешность внутричастотного хэндовера',
    threshold_critical = '< 96',
    threshold_warning = '< 98'
WHERE name = 'Intra_Freq_Handover_Success_Rate';

UPDATE metrics_configuration SET 
    description_ru = 'Успешность межчастотного хэндовера',
    threshold_critical = '< 95',
    threshold_warning = '< 97'
WHERE name = 'Inter_Freq_Handover_Success_Rate';

UPDATE metrics_configuration SET 
    description_ru = 'Успешность межсистемного хэндовера',
    threshold_critical = '< 90',
    threshold_warning = '< 95'
WHERE name = 'Inter_RAT_Handover_Success_Rate';

UPDATE metrics_configuration SET 
    description_ru = 'Успешность хэндовера по интерфейсу X2',
    threshold_critical = '< 96',
    threshold_warning = '< 98'
WHERE name = 'X2_Handover_Success_Rate';

UPDATE metrics_configuration SET 
    description_ru = 'Успешность хэндовера по интерфейсу S1',
    threshold_critical = '< 95',
    threshold_warning = '< 97'
WHERE name = 'S1_Handover_Success_Rate';

UPDATE metrics_configuration SET 
    description_ru = 'Время подготовки хэндовера',
    threshold_critical = '> 200',
    threshold_warning = '> 150'
WHERE name = 'Handover_Preparation_Time';

UPDATE metrics_configuration SET 
    description_ru = 'Время выполнения хэндовера',
    threshold_critical = '> 100',
    threshold_warning = '> 80'
WHERE name = 'Handover_Execution_Time';

UPDATE metrics_configuration SET 
    description_ru = 'Коэффициент неудачных хэндоверов',
    threshold_critical = '> 4',
    threshold_warning = '> 2'
WHERE name = 'Handover_Failure_Rate';

UPDATE metrics_configuration SET 
    description_ru = 'Коэффициент "пинг-понг" хэндоверов',
    threshold_critical = '> 10',
    threshold_warning = '> 5'
WHERE name = 'Ping_Pong_Handover_Rate';

UPDATE metrics_configuration SET 
    description_ru = 'Время прерывания при мобильности',
    threshold_critical = '> 100',
    threshold_warning = '> 70'
WHERE name = 'Mobility_Interruption_Time';

-- Update Integrity Metrics (Group 10)
UPDATE metrics_configuration SET 
    description_ru = 'Коэффициент потерь служебных данных PDCP',
    threshold_critical = '> 1',
    threshold_warning = '> 0.5'
WHERE name = 'PDCP_SDU_Loss_Rate';

UPDATE metrics_configuration SET 
    description_ru = 'Коэффициент повторных передач RLC',
    threshold_critical = '> 10',
    threshold_warning = '> 5'
WHERE name = 'RLC_Retransmission_Rate';

UPDATE metrics_configuration SET 
    description_ru = 'Коэффициент повторных передач MAC',
    threshold_critical = '> 15',
    threshold_warning = '> 10'
WHERE name = 'MAC_Retransmission_Rate';

UPDATE metrics_configuration SET 
    description_ru = 'Коэффициент повторных передач HARQ',
    threshold_critical = '> 20',
    threshold_warning = '> 15'
WHERE name = 'HARQ_Retransmission_Rate';

UPDATE metrics_configuration SET 
    description_ru = 'Коэффициент ошибочных кадров',
    threshold_critical = '> 5',
    threshold_warning = '> 3'
WHERE name = 'FER';

UPDATE metrics_configuration SET 
    description_ru = 'Остаточный коэффициент битовых ошибок',
    threshold_critical = '> 0.001',
    threshold_warning = '> 0.0001'
WHERE name = 'Residual_BER';

UPDATE metrics_configuration SET 
    description_ru = 'Коэффициент потерь IP пакетов',
    threshold_critical = '> 2',
    threshold_warning = '> 1'
WHERE name = 'IP_Packet_Loss_Rate';

UPDATE metrics_configuration SET 
    description_ru = 'Успешность обеспечения целостности данных',
    threshold_critical = '< 95',
    threshold_warning = '< 98'
WHERE name = 'Data_Integrity_Success_Rate';

-- Update Resource Utilization Metrics (Group 11)
UPDATE metrics_configuration SET 
    description_ru = 'Средняя загрузка физических ресурсных блоков',
    threshold_critical = '> 95',
    threshold_warning = '> 85'
WHERE name = 'PRB_Utilization_Mean';

UPDATE metrics_configuration SET 
    description_ru = 'Использование элементов управляющего канала',
    threshold_critical = '> 90',
    threshold_warning = '> 80'
WHERE name = 'CCE_Utilization';

UPDATE metrics_configuration SET 
    description_ru = 'Использование физического восходящего канала управления',
    threshold_critical = '> 90',
    threshold_warning = '> 80'
WHERE name = 'PUCCH_Utilization';

UPDATE metrics_configuration SET 
    description_ru = 'Использование физического нисходящего канала управления',
    threshold_critical = '> 90',
    threshold_warning = '> 80'
WHERE name = 'PDCCH_Utilization';

UPDATE metrics_configuration SET 
    description_ru = 'Эффективность использования лицензированного спектра',
    threshold_critical = '< 1.0',
    threshold_warning = '< 1.5'
WHERE name = 'Licensed_Spectrum_Efficiency';

UPDATE metrics_configuration SET 
    description_ru = 'Коэффициент использования ресурсных блоков',
    threshold_critical = '> 95',
    threshold_warning = '> 85'
WHERE name = 'Resource_Block_Usage_Rate';

UPDATE metrics_configuration SET 
    description_ru = 'Использование агрегации несущих',
    threshold_critical = '> 95',
    threshold_warning = '> 85'
WHERE name = 'Carrier_Aggregation_Utilization';

-- Update Capacity Metrics (Group 12)
UPDATE metrics_configuration SET 
    description_ru = 'Максимальное количество активных UE в нисходящем канале',
    threshold_critical = '< 100',
    threshold_warning = '< 200'
WHERE name = 'Max_Active_UE_DL';

UPDATE metrics_configuration SET 
    description_ru = 'Максимальное количество активных UE в восходящем канале',
    threshold_critical = '< 100',
    threshold_warning = '< 200'
WHERE name = 'Max_Active_UE_UL';

UPDATE metrics_configuration SET 
    description_ru = 'Среднее количество активных UE',
    threshold_critical = '> 8000',
    threshold_warning = '> 6000'
WHERE name = 'Average_Active_UE';

UPDATE metrics_configuration SET 
    description_ru = 'Пиковое количество подключенных пользователей',
    threshold_critical = '< 500',
    threshold_warning = '< 1000'
WHERE name = 'Peak_Connected_Users';

UPDATE metrics_configuration SET 
    description_ru = 'Плотность подключений на квадратный километр',
    threshold_critical = '< 1000',
    threshold_warning = '< 5000'
WHERE name = 'Connection_Density';

UPDATE metrics_configuration SET 
    description_ru = 'Объем трафика в нисходящем канале',
    threshold_critical = '< 100',
    threshold_warning = '< 500'
WHERE name = 'Traffic_Volume_DL';

UPDATE metrics_configuration SET 
    description_ru = 'Объем трафика в восходящем канале',
    threshold_critical = '< 50',
    threshold_warning = '< 200'
WHERE name = 'Traffic_Volume_UL';

UPDATE metrics_configuration SET 
    description_ru = 'Емкость трафика на квадратный километр',
    threshold_critical = '< 50',
    threshold_warning = '< 100'
WHERE name = 'Area_Traffic_Capacity';

-- Update Voice Quality Metrics (Group 13)
UPDATE metrics_configuration SET 
    description_ru = 'Успешность установки VoLTE вызова',
    threshold_critical = '< 95',
    threshold_warning = '< 98'
WHERE name = 'VoLTE_Call_Setup_Success_Rate';

UPDATE metrics_configuration SET 
    description_ru = 'Коэффициент прерванных VoLTE вызовов',
    threshold_critical = '> 2',
    threshold_warning = '> 1'
WHERE name = 'VoLTE_Call_Drop_Rate';

UPDATE metrics_configuration SET 
    description_ru = 'Успешность передачи голоса при переключении (SRVCC)',
    threshold_critical = '< 95',
    threshold_warning = '< 98'
WHERE name = 'VoLTE_SRVCC_Success_Rate';

UPDATE metrics_configuration SET 
    description_ru = 'Средняя оценка качества голоса',
    threshold_critical = '< 3.0',
    threshold_warning = '< 3.5'
WHERE name = 'Voice_MOS';

UPDATE metrics_configuration SET 
    description_ru = 'Коэффициент потерь голосовых пакетов',
    threshold_critical = '> 3',
    threshold_warning = '> 1'
WHERE name = 'Voice_Packet_Loss_Rate';

UPDATE metrics_configuration SET 
    description_ru = 'Джиттер голосовых пакетов',
    threshold_critical = '> 50',
    threshold_warning = '> 30'
WHERE name = 'Voice_Jitter';

UPDATE metrics_configuration SET 
    description_ru = 'Сквозная задержка голоса',
    threshold_critical = '> 200',
    threshold_warning = '> 150'
WHERE name = 'E2E_Voice_Latency';

UPDATE metrics_configuration SET 
    description_ru = 'Успешность установки VoNR вызова (5G)',
    threshold_critical = '< 95',
    threshold_warning = '< 98'
WHERE name = 'VoNR_Call_Setup_Success_Rate';

-- Update 5G Advanced Metrics (Group 14)
UPDATE metrics_configuration SET 
    description_ru = 'Успешность управления лучами',
    threshold_critical = '< 95',
    threshold_warning = '< 98'
WHERE name = 'Beam_Management_Success_Rate';

UPDATE metrics_configuration SET 
    description_ru = 'Мощность опорного сигнала блока синхронизации',
    threshold_critical = '< -120',
    threshold_warning = '< -110'
WHERE name = 'SSB_RSRP';

UPDATE metrics_configuration SET 
    description_ru = 'Время переключения луча',
    threshold_critical = '> 50',
    threshold_warning = '> 30'
WHERE name = 'Beam_Switching_Time';

UPDATE metrics_configuration SET 
    description_ru = 'Эффективность Massive MIMO',
    threshold_critical = '< 2.0',
    threshold_warning = '< 3.0'
WHERE name = 'Massive_MIMO_Efficiency';

UPDATE metrics_configuration SET 
    description_ru = 'Доступность сетевого среза',
    threshold_critical = '< 99',
    threshold_warning = '< 99.5'
WHERE name = 'Network_Slice_Availability';

UPDATE metrics_configuration SET 
    description_ru = 'Изоляция сетевого среза',
    threshold_critical = '< 95',
    threshold_warning = '< 98'
WHERE name = 'Network_Slice_Isolation';

UPDATE metrics_configuration SET 
    description_ru = 'Надежность URLLC (сверхнадежная связь с малой задержкой)',
    threshold_critical = '< 99.9',
    threshold_warning = '< 99.95'
WHERE name = 'URLLC_Reliability';

UPDATE metrics_configuration SET 
    description_ru = 'Задержка URLLC',
    threshold_critical = '> 1',
    threshold_warning = '> 0.5'
WHERE name = 'URLLC_Latency';

UPDATE metrics_configuration SET 
    description_ru = 'Плотность подключений mMTC (массовая межмашинная связь)',
    threshold_critical = '< 10000',
    threshold_warning = '< 50000'
WHERE name = 'mMTC_Connection_Density';

UPDATE metrics_configuration SET 
    description_ru = 'Пиковая скорость передачи данных eMBB',
    threshold_critical = '< 1.0',
    threshold_warning = '< 2.0'
WHERE name = 'eMBB_Peak_Data_Rate';

-- Update Control Plane Metrics (Group 15)
UPDATE metrics_configuration SET 
    description_ru = 'Задержка плоскости управления',
    threshold_critical = '> 100',
    threshold_warning = '> 50'
WHERE name = 'Control_Plane_Latency';

UPDATE metrics_configuration SET 
    description_ru = 'Время перехода из режима ожидания в активный',
    threshold_critical = '> 200',
    threshold_warning = '> 150'
WHERE name = 'Idle_to_Active_Transition_Time';

UPDATE metrics_configuration SET 
    description_ru = 'Успешность процедуры пейджинга',
    threshold_critical = '< 95',
    threshold_warning = '< 98'
WHERE name = 'Paging_Success_Rate';

UPDATE metrics_configuration SET 
    description_ru = 'Успешность процедуры обновления зоны отслеживания',
    threshold_critical = '< 95',
    threshold_warning = '< 98'
WHERE name = 'TAU_Success_Rate';

UPDATE metrics_configuration SET 
    description_ru = 'Успешность процедуры регистрации',
    threshold_critical = '< 95',
    threshold_warning = '< 98'
WHERE name = 'Registration_Success_Rate';

UPDATE metrics_configuration SET 
    description_ru = 'Нагрузка сигнализации',
    threshold_critical = '> 10000',
    threshold_warning = '> 8000'
WHERE name = 'Signaling_Load';

-- Update User Plane Metrics (Group 16)
UPDATE metrics_configuration SET 
    description_ru = 'Задержка пользовательской плоскости',
    threshold_critical = '> 50',
    threshold_warning = '> 20'
WHERE name = 'User_Plane_Latency';

UPDATE metrics_configuration SET 
    description_ru = 'Воспринимаемая пользователем скорость передачи данных DL',
    threshold_critical = '< 5',
    threshold_warning = '< 10'
WHERE name = 'User_Experienced_Data_Rate_DL';

UPDATE metrics_configuration SET 
    description_ru = 'Воспринимаемая пользователем скорость передачи данных UL',
    threshold_critical = '< 2',
    threshold_warning = '< 5'
WHERE name = 'User_Experienced_Data_Rate_UL';

UPDATE metrics_configuration SET 
    description_ru = 'Пропускная способность пользователя на краю соты DL',
    threshold_critical = '< 1',
    threshold_warning = '< 5'
WHERE name = 'Cell_Edge_User_Throughput_DL';

UPDATE metrics_configuration SET 
    description_ru = 'Пропускная способность пользователя на краю соты UL',
    threshold_critical = '< 0.5',
    threshold_warning = '< 2'
WHERE name = 'Cell_Edge_User_Throughput_UL';

UPDATE metrics_configuration SET 
    description_ru = 'Средняя пропускная способность пользователя DL',
    threshold_critical = '< 5',
    threshold_warning = '< 10'
WHERE name = 'Average_User_Throughput_DL';

UPDATE metrics_configuration SET 
    description_ru = 'Средняя пропускная способность пользователя UL',
    threshold_critical = '< 2',
    threshold_warning = '< 5'
WHERE name = 'Average_User_Throughput_UL';

UPDATE metrics_configuration SET 
    description_ru = 'Пиковая пропускная способность пользователя DL',
    threshold_critical = '< 50',
    threshold_warning = '< 100'
WHERE name = 'Peak_User_Throughput_DL';

UPDATE metrics_configuration SET 
    description_ru = 'Пиковая пропускная способность пользователя UL',
    threshold_critical = '< 20',
    threshold_warning = '< 50'
WHERE name = 'Peak_User_Throughput_UL';

-- Update Energy Efficiency Metrics (Group 17)
UPDATE metrics_configuration SET 
    description_ru = 'Энергоэффективность сети',
    threshold_critical = '< 0.5',
    threshold_warning = '< 1.0'
WHERE name = 'Network_Energy_Efficiency';

UPDATE metrics_configuration SET 
    description_ru = 'Энергоэффективность пользовательского оборудования',
    threshold_critical = '< 0.5',
    threshold_warning = '< 1.0'
WHERE name = 'UE_Energy_Efficiency';

UPDATE metrics_configuration SET 
    description_ru = 'Энергопотребление на соту',
    threshold_critical = '> 2000',
    threshold_warning = '> 1500'
WHERE name = 'Power_Consumption_Per_Cell';

UPDATE metrics_configuration SET 
    description_ru = 'Энергия на бит',
    threshold_critical = '> 0.01',
    threshold_warning = '> 0.005'
WHERE name = 'Energy_Per_Bit';

UPDATE metrics_configuration SET 
    description_ru = 'Эффективность режима сна',
    threshold_critical = '< 70',
    threshold_warning = '< 85'
WHERE name = 'Sleep_Mode_Efficiency';

-- Update QoS Metrics (Group 18)
UPDATE metrics_configuration SET 
    description_ru = 'Коэффициент потерь пакетов для QCI 1 (голос)',
    threshold_critical = '> 2',
    threshold_warning = '> 1'
WHERE name = 'QCI_1_Packet_Loss_Rate';

UPDATE metrics_configuration SET 
    description_ru = 'Коэффициент потерь пакетов для QCI 5 (сигнализация)',
    threshold_critical = '> 1',
    threshold_warning = '> 0.5'
WHERE name = 'QCI_5_Packet_Loss_Rate';

UPDATE metrics_configuration SET 
    description_ru = 'Коэффициент потерь пакетов для QCI 9 (данные)',
    threshold_critical = '> 5',
    threshold_warning = '> 2'
WHERE name = 'QCI_9_Packet_Loss_Rate';

UPDATE metrics_configuration SET 
    description_ru = 'Успешность установки GBR канала',
    threshold_critical = '< 95',
    threshold_warning = '< 98'
WHERE name = 'GBR_Bearer_Setup_Success_Rate';

UPDATE metrics_configuration SET 
    description_ru = 'Успешность установки не-GBR канала',
    threshold_critical = '< 95',
    threshold_warning = '< 98'
WHERE name = 'Non_GBR_Bearer_Setup_Success_Rate';

UPDATE metrics_configuration SET 
    description_ru = 'Успешность установки QoS потока',
    threshold_critical = '< 95',
    threshold_warning = '< 98'
WHERE name = 'QoS_Flow_Setup_Success_Rate';

UPDATE metrics_configuration SET 
    description_ru = 'Коэффициент нарушений бюджета задержки пакетов',
    threshold_critical = '> 5',
    threshold_warning = '> 2'
WHERE name = 'PDB_Violation_Rate';

UPDATE metrics_configuration SET 
    description_ru = 'Коэффициент нарушений лимита потерь пакетов',
    threshold_critical = '> 5',
    threshold_warning = '> 2'
WHERE name = 'PELR_Violation_Rate';

-- Update Coverage Metrics (Group 19)
UPDATE metrics_configuration SET 
    description_ru = 'Площадь покрытия',
    threshold_critical = '< 10',
    threshold_warning = '< 50'
WHERE name = 'Coverage_Area';

UPDATE metrics_configuration SET 
    description_ru = 'Коэффициент покрытия внутри помещений',
    threshold_critical = '< 70',
    threshold_warning = '< 85'
WHERE name = 'Indoor_Coverage_Ratio';

UPDATE metrics_configuration SET 
    description_ru = 'Коэффициент покрытия вне помещений',
    threshold_critical = '< 85',
    threshold_warning = '< 95'
WHERE name = 'Outdoor_Coverage_Ratio';

UPDATE metrics_configuration SET 
    description_ru = 'Глубокое проникновение внутрь зданий',
    threshold_critical = '< 10',
    threshold_warning = '< 15'
WHERE name = 'Deep_Indoor_Penetration';

UPDATE metrics_configuration SET 
    description_ru = 'Радиус действия соты',
    threshold_critical = '< 0.5',
    threshold_warning = '< 1.0'
WHERE name = 'Cell_Range';

UPDATE metrics_configuration SET 
    description_ru = 'Вероятность покрытия',
    threshold_critical = '< 85',
    threshold_warning = '< 90'
WHERE name = 'Coverage_Probability';

-- Update Interference Metrics (Group 20)
UPDATE metrics_configuration SET 
    description_ru = 'Межсотовые помехи',
    threshold_critical = '> -70',
    threshold_warning = '> -80'
WHERE name = 'Inter_Cell_Interference';

UPDATE metrics_configuration SET 
    description_ru = 'Внутрисотовые помехи',
    threshold_critical = '> -75',
    threshold_warning = '> -85'
WHERE name = 'Intra_Cell_Interference';

UPDATE metrics_configuration SET 
    description_ru = 'Помехи в соседнем канале',
    threshold_critical = '> -70',
    threshold_warning = '> -80'
WHERE name = 'Adjacent_Channel_Interference';

UPDATE metrics_configuration SET 
    description_ru = 'Помехи в совмещенном канале',
    threshold_critical = '> -70',
    threshold_warning = '> -80'
WHERE name = 'Co_Channel_Interference';

UPDATE metrics_configuration SET 
    description_ru = 'Подъем шума',
    threshold_critical = '> 10',
    threshold_warning = '> 7'
WHERE name = 'Noise_Rise';

UPDATE metrics_configuration SET 
    description_ru = 'Помехи по отношению к тепловому шуму',
    threshold_critical = '> 10',
    threshold_warning = '> 7'
WHERE name = 'IoT';

-- Update Carrier Aggregation Metrics (Group 21)
UPDATE metrics_configuration SET 
    description_ru = 'Успешность конфигурации агрегации несущих',
    threshold_critical = '< 95',
    threshold_warning = '< 98'
WHERE name = 'CA_Configuration_Success_Rate';

UPDATE metrics_configuration SET 
    description_ru = 'Успешность активации агрегации несущих',
    threshold_critical = '< 95',
    threshold_warning = '< 98'
WHERE name = 'CA_Activation_Success_Rate';

UPDATE metrics_configuration SET 
    description_ru = 'Успешность добавления вторичной соты',
    threshold_critical = '< 95',
    threshold_warning = '< 98'
WHERE name = 'SCell_Addition_Success_Rate';

UPDATE metrics_configuration SET 
    description_ru = 'Время активации вторичной соты',
    threshold_critical = '> 200',
    threshold_warning = '> 150'
WHERE name = 'SCell_Activation_Time';

UPDATE metrics_configuration SET 
    description_ru = 'Прирост пропускной способности от CA',
    threshold_critical = '< 20',
    threshold_warning = '< 50'
WHERE name = 'CA_Throughput_Gain';

-- Update Dual Connectivity Metrics (Group 22)
UPDATE metrics_configuration SET 
    description_ru = 'Успешность установки EN-DC (E-UTRAN-NR двойная связность)',
    threshold_critical = '< 95',
    threshold_warning = '< 98'
WHERE name = 'ENDC_Setup_Success_Rate';

UPDATE metrics_configuration SET 
    description_ru = 'Успешность добавления EN-DC',
    threshold_critical = '< 95',
    threshold_warning = '< 98'
WHERE name = 'ENDC_Addition_Success_Rate';

UPDATE metrics_configuration SET 
    description_ru = 'Успешность добавления вторичного gNodeB',
    threshold_critical = '< 95',
    threshold_warning = '< 98'
WHERE name = 'SgNB_Addition_Success_Rate';

UPDATE metrics_configuration SET 
    description_ru = 'Успешность модификации вторичного gNodeB',
    threshold_critical = '< 95',
    threshold_warning = '< 98'
WHERE name = 'SgNB_Modification_Success_Rate';

UPDATE metrics_configuration SET 
    description_ru = 'Прирост пропускной способности от двойной связности',
    threshold_critical = '< 30',
    threshold_warning = '< 60'
WHERE name = 'DC_Throughput_Gain';

UPDATE metrics_configuration SET 
    description_ru = 'Успешность установки многорадиодоступной двойной связности',
    threshold_critical = '< 95',
    threshold_warning = '< 98'
WHERE name = 'MR_DC_Setup_Success_Rate';

