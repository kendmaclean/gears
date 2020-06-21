var blockly = new function() {
  var self = this;
  var options = {
    toolbox : null,
    zoom: {
      controls: true
    },
    move: {
      wheel: true
    },
    collapse : true,
    comments : true,
    disable : true,
    maxBlocks : Infinity,
    trashcan : false,
    horizontalLayout : false,
    toolboxPosition : 'start',
    css : true,
    media : 'https://blockly-demo.appspot.com/static/media/',
    rtl : false,
    scrollbars : true,
    sounds : true,
    oneBasedIndex : true
  };

  this.unsaved = false;

  // Run on page load
  this.init = function() {
    Blockly.geras.Renderer.prototype.makeConstants_ = function() {
      var constants = new Blockly.geras.ConstantProvider();
      constants.ADD_START_HATS = true;
      return constants;
    };

    self.loadCustomBlocks();
    self.loadToolBox();
    self.loadPythonGenerators();
  };

  // Load toolbox
  this.loadToolBox = function() {
    return fetch('toolbox.xml')
      .then(response => response.text())
      .then(function(response) {
        var xml = (new DOMParser()).parseFromString(response, "text/xml");
        options.toolbox = xml.getElementById('toolbox');
        self.workspace = Blockly.inject('blocklyDiv', options);

        self.loadDefaultWorkspace();

        self.workspace.addChangeListener(Blockly.Events.disableOrphans);
        self.loadLocalStorage();
        setTimeout(function(){
          self.workspace.addChangeListener(self.checkModified);
        }, 2000);
      });
  };

  // Load default workspace
  this.loadDefaultWorkspace = function() {
    let xmlText =
      '<xml xmlns="https://developers.google.com/blockly/xml" id="workspaceBlocks" style="display: none">' +
        '<block type="when_started" id="Q!^ZqS4/(a/0XL$cIi-~" x="63" y="38" deletable="false"></block>' +
      '</xml>';
    self.loadXmlText(xmlText);
  };

  // Load custom blocks
  this.loadCustomBlocks = function() {
    return fetch('customBlocks.json')
      .then(response => response.json())
      .then(function(response) {
        Blockly.defineBlocksWithJsonArray(response);
      });
  };

  // Mark workspace as unsaved
  this.checkModified = function(e) {
    if (e.type != Blockly.Events.UI) {
      self.unsaved = true;
      blocklyPanel.showSave();
    }
  };

  // get xmlText
  this.getXmlText = function() {
    var xml = Blockly.Xml.workspaceToDom(self.workspace);
    return Blockly.Xml.domToText(xml);
  };

  // Save to local storage
  this.saveLocalStorage = function() {
    if (self.workspace && self.unsaved) {
      self.unsaved = false;
      blocklyPanel.hideSave();
      localStorage.setItem('blocklyXML', self.getXmlText());
    }
  };

  // load xmlText to workspace
  this.loadXmlText = function(xmlText) {
    let oldXmlText = self.getXmlText();
    if (xmlText) {
      try {
        var xml = Blockly.Xml.textToDom(xmlText);
        self.workspace.clear();
        Blockly.Xml.domToWorkspace(xml, self.workspace);
      }
      catch (err) {
        toastMsg('Invalid Blocks');
        self.loadXmlText(oldXmlText);
      }
    }
  };

  // Load from local storage
  this.loadLocalStorage = function() {
    self.loadXmlText(localStorage.getItem('blocklyXML'));
  };

  // Load Python generators
  this.loadPythonGenerators = function() {
    Blockly.Python['print'] = self.pythonPrint;
    Blockly.Python['when_started'] = self.pythonStart;
    Blockly.Python['sleep'] = self.pythonSleep;
    Blockly.Python['stop'] = self.pythonStop;
    Blockly.Python['move_steering'] = self.pythonMoveSteering;
    Blockly.Python['exit'] = self.pythonExit;
    Blockly.Python['position'] = self.pythonPosition;
    Blockly.Python['reset_motor'] = self.pythonResetMotor;
    Blockly.Python['move_tank'] = self.pythonMoveTank;
    Blockly.Python['color_sensor'] = self.pythonColorSensor;
    Blockly.Python['ultrasonic_sensor'] = self.pythonUltrasonicSensor;
    Blockly.Python['gyro_sensor'] = self.pythonGyroSensor;
    Blockly.Python['reset_gyro'] = self.pythonResetGyroSensor;
  };

  // Generate python code
  this.genPython = function() {
    let code =
      '#!/usr/bin/env python3\n\n' +
      'import time\n' +
      'from ev3dev2.motor import *\n' +
      'from ev3dev2.sensor import *\n' +
      'from ev3dev2.sensor.lego import *\n' +
      '\n' +
      'left_motor = LargeMotor(OUTPUT_A)\n' +
      'right_motor = LargeMotor(OUTPUT_B)\n' +
      'steering_drive = MoveSteering(OUTPUT_A, OUTPUT_B)\n' +
      'tank_drive = MoveTank(OUTPUT_A, OUTPUT_B)\n\n';

    var sensorsCode = '';
    var i = 1;
    var sensor = null;
    while (sensor = robot.getComponentByPort('in' + i)) {
      if (sensor.type == 'ColorSensor') {
        sensorsCode += 'color_sensor_in' + i + ' = ColorSensor(INPUT_' + i + ')\n'
      } else if (sensor.type == 'UltrasonicSensor') {
        sensorsCode += 'ultrasonic_sensor_in' + i + ' = UltrasonicSensor(INPUT_' + i + ')\n'
      } else if (sensor.type == 'GyroSensor') {
        sensorsCode += 'gyro_sensor_in' + i + ' = GyroSensor(INPUT_' + i + ')\n'      }
      i++;
    }

    code += sensorsCode + '\n';

    code += Blockly.Python.workspaceToCode(Blockly.getMainWorkspace());
    return code
  };


  //
  // Python Generators
  //

  // Print
  this.pythonPrint = function(block) {
    var value_text = Blockly.Python.valueToCode(block, 'text', Blockly.Python.ORDER_ATOMIC);

    var code = 'print(' + value_text + ')\n';
    return code;
  };

  // Start
  this.pythonStart = function(block) {
    var code = '';
    return code;
  };

  // Sleep
  this.pythonSleep = function(block) {
    var value_seconds = Blockly.Python.valueToCode(block, 'seconds', Blockly.Python.ORDER_ATOMIC);

    var code = 'time.sleep(' + value_seconds + ')\n';
    return code;
  };

  // Stop
  this.pythonStop = function(block) {
    var dropdown_stop_action = block.getFieldValue('stop_action');
    if (dropdown_stop_action == 'HOLD') {
      var brake = 'True';
    } else {
      var brake = 'False';
    }

    var code = 'steering_drive.stop(brake=' + brake + ')\n';
    return code;
  };

  // Move steering
  this.pythonMoveSteering = function(block) {
    var value_steering = Blockly.Python.valueToCode(block, 'steering', Blockly.Python.ORDER_ATOMIC);
    var value_speed = Blockly.Python.valueToCode(block, 'speed', Blockly.Python.ORDER_ATOMIC);
    var dropdown_units = block.getFieldValue('units');

    if (dropdown_units == 'PERCENT') {
      var code = 'steering_drive.on(' + value_steering + ', ' + value_speed + ')\n';
    } else if (dropdown_units == 'DEGREES') {
      var code = 'steering_drive.on(' + value_steering + ', SpeedDPS(' + value_speed + '))\n';
    } else if (dropdown_units == 'ROTATIONS') {
      var code = 'steering_drive.on(' + value_steering + ', SpeedRPS(' + value_speed + '))\n';
    }
    return code;
  };

  // Exit
  this.pythonExit = function(block) {
    var code = 'exit()\n';
    return code;
  };

  // get position
  this.pythonPosition = function(block) {
    var dropdown_motor = block.getFieldValue('motor');
    var dropdown_units = block.getFieldValue('units');

    if (dropdown_motor == 'LEFT') {
      var code = 'left_motor.position';
    } else {
      var code = 'right_motor.position';
    }

    if (dropdown_units == 'ROTATIONS') {
      var code = '(' + code + ' / 360.0)';
    }

    return [code, Blockly.Python.ORDER_ATOMIC];
  };

  // reset position
  this.pythonResetMotor = function(block) {
    var dropdown_motor = block.getFieldValue('motor');
    if (dropdown_motor == 'LEFT') {
      var code = 'left_motor.position = 0\n';
    } else if (dropdown_motor == 'RIGHT') {
      var code = 'right_motor.position = 0\n';
    } else {
      var code =
        'left_motor.position = 0\n' +
        'right_motor.position = 0\n';
    }

    return code;
  };

  // move tank
  this.pythonMoveTank = function(block) {
    var value_left = Blockly.Python.valueToCode(block, 'left', Blockly.Python.ORDER_ATOMIC);
    var value_right = Blockly.Python.valueToCode(block, 'right', Blockly.Python.ORDER_ATOMIC);
    var dropdown_units = block.getFieldValue('units');

    if (dropdown_units == 'PERCENT') {
      var code = 'tank_drive.on(' + value_left + ', ' + value_right + ')\n';
    } else if (dropdown_units == 'DEGREES') {
      var code = 'tank_drive.on(SpeedDPS(' + value_left + '), SpeedDPS(' + value_right + '))\n';
    } else if (dropdown_units == 'ROTATIONS') {
      var code = 'tank_drive.on(SpeedRPS(' + value_left + '), SpeedRPS(' + value_right + '))\n';
    }
    return code;
  };

  // color sensor value
  this.pythonColorSensor = function(block) {
    var dropdown_type = block.getFieldValue('type');
    var value_port = Blockly.Python.valueToCode(block, 'port', Blockly.Python.ORDER_ATOMIC);
    var typeStr = '';

    if (dropdown_type == 'INTENSITY') {
      typeStr = 'reflected_light_intensity';
    } else if (dropdown_type == 'COLOR') {
      typeStr = 'color';
    } else if (dropdown_type == 'RED') {
      typeStr = 'rgb[0]';
    } else if (dropdown_type == 'GREEN') {
      typeStr = 'rgb[1]';
    } else if (dropdown_type == 'BLUE') {
      typeStr = 'rgb[2]';
    } else if (dropdown_type == 'HUE') {
      typeStr = 'hsv[0]';
    } else if (dropdown_type == 'SATURATION') {
      typeStr = 'hsv[1]';
    } else if (dropdown_type == 'VALUE') {
      typeStr = 'hsv[2]';
    }

    var code = 'color_sensor_in' + value_port + '.' + typeStr;
    return [code, Blockly.Python.ORDER_ATOMIC];
  };

  // ultrasonic
  this.pythonUltrasonicSensor = function(block) {
    var dropdown_units = block.getFieldValue('units');
    var value_port = Blockly.Python.valueToCode(block, 'port', Blockly.Python.ORDER_ATOMIC);
    var unitsStr = '';

    if (dropdown_units == 'CM') {
      unitsStr = 'distance_centimeters';
    } else if (dropdown_units == 'INCHES') {
      unitsStr = 'distance_inches';
    }
    var code = 'ultrasonic_sensor_in' + value_port + '.' + unitsStr;
    return [code, Blockly.Python.ORDER_ATOMIC];
  };

  // gyro
  this.pythonGyroSensor = function(block) {
    var dropdown_type = block.getFieldValue('type');
    var value_port = Blockly.Python.valueToCode(block, 'port', Blockly.Python.ORDER_ATOMIC);

    if (dropdown_type == 'ANGLE') {
      var typeStr = 'angle';
    } else if (dropdown_type == 'RATE') {
      var typeStr = 'rate';
    }
    var code = 'gyro_sensor_in' + value_port + '.' + typeStr;

    return [code, Blockly.Python.ORDER_ATOMIC];
  };

  // gyro reset
  this.pythonResetGyroSensor = function(block) {
    var value_port = Blockly.Python.valueToCode(block, 'port', Blockly.Python.ORDER_ATOMIC);

    var code = 'gyro_sensor_in' + value_port + '.reset()\n';
    return code;
  };
}

// Init class
blockly.init();
