import * as Blockly from 'blockly/core';

import '../fields/BlocklyReactField';
import '../fields/DateField';

const customBlocks = require("./customBlocks.json");

for (let i = 0; i < customBlocks.length; i++) {
  if (customBlocks[i].type === "logic_compare") {
    Blockly.Blocks['logic_compare'] = {
      /**
       * Block for comparison operator.
       * @this Blockly.Block
       */
      init: function () {
        var OPERATORS = [
          ['=', 'EQ'],
          ['\u2260', 'NEQ'],
          ['<', 'LT'],
          ['<=', 'LTE'],
          ['>', 'GT'],
          ['>=', 'GTE']
        ];
        this.setColour(44);
        this.setOutput(true, 'Boolean');
        this.appendValueInput('A');
        this.appendValueInput('B')
          .appendField(new Blockly.FieldDropdown(OPERATORS), 'OP');
        this.setInputsInline(true);
        var thisBlock = this;
        this.setTooltip(function () {
          var op = thisBlock.getFieldValue('OP');
          var TOOLTIPS = {
            'EQ': "Return true if both inputs equal each other.",
            'NEQ': "Return true if both inputs are not equal to each other.",
            'LT': "Return true if the first input is smaller than the second input.",
            'LTE': "Return true if the first input is smaller than or equal to the second input.",
            'GT': "Return true if the first input is greater than the second input.",
            'GTE': "Return true if the first input is greater than or equal to the second input."
          };
          return TOOLTIPS[op];
        });
        this.prevBlocks_ = [null, null];
      },
      /**
       * Called whenever anything on the workspace changes.
       * Prevent mismatched types from being compared.
       * @this Blockly.Block
       */
      onchange: function () {
        if (!this.workspace) {
          return;
        }
        var blockA = this.getInputTargetBlock('A');
        var blockB = this.getInputTargetBlock('B');
        if (blockA && blockB &&
          !blockA.outputConnection.checkType_(blockB.outputConnection)) {
          for (var i = 0; i < this.prevBlocks_.length; i++) {
            var block = this.prevBlocks_[i];
            if (block === blockA || block === blockB) {
              block.setParent(null);
              block.bumpNeighbours_();
            }
          }
        }
        this.prevBlocks_[0] = blockA;
        this.prevBlocks_[1] = blockB;
      }
    };
  }
  else if (customBlocks[i].type === "variables_get") {
    Blockly.Blocks['variables_get'] = {
      /**
       * Block for variable getter.
       * @this Blockly.Block
       */
      init: function () {
        this.setColour(300);
        this.appendDummyInput()
          .appendField(new Blockly.FieldVariable(
            "i"), 'VAR');
        this.setOutput(true);
        this.setTooltip("Returns the value of this variable.");
      },
      /**
       * Return all variables referenced by this block.
       * @return {!Array.<string>} List of variable names.
       * @this Blockly.Block
       */
      getVars: function () {
        return [this.getFieldValue('VAR')];
      },
      /**
       * Notification that a variable is renaming.
       * If the name matches one of this block's variables, rename it.
       * @param {string} oldName Previous name of variable.
       * @param {string} newName Renamed variable.
       * @this Blockly.Block
       */
      renameVar: function (oldName, newName) {
        if (Blockly.Names.equals(oldName, this.getFieldValue('VAR'))) {
          this.setFieldValue(newName, 'VAR');
        }
      },
      contextMenuType_: 'variables_set'
    };
  }
  else if (customBlocks[i].type === "variables_set") {
    Blockly.Blocks['variables_set'] = {
      /**
       * Block for variable setter.
       * @this Blockly.Block
       */
      init: function () {
        this.jsonInit({
          "message0": "set %1 to %2",
          "args0": [
            {
              "type": "field_variable",
              "name": "VAR",
              "variable": "i"
            },
            {
              "type": "input_value",
              "name": "VALUE"
            }
          ],
          "previousStatement": null,
          "nextStatement": null,
          "colour": 300,
          "tooltip": "Sets this variable to be equal to the input."
        });
      },
      /**
       * Return all variables referenced by this block.
       * @return {!Array.<string>} List of variable names.
       * @this Blockly.Block
       */
      getVars: function () {
        return [this.getFieldValue('VAR')];
      },
      /**
       * Notification that a variable is renaming.
       * If the name matches one of this block's variables, rename it.
       * @param {string} oldName Previous name of variable.
       * @param {string} newName Renamed variable.
       * @this Blockly.Block
       */
      renameVar: function (oldName, newName) {
        if (Blockly.Names.equals(oldName, this.getFieldValue('VAR'))) {
          this.setFieldValue(newName, 'VAR');
        }
      },
      contextMenuType_: 'variables_get',
      customContextMenu: Blockly.Blocks['variables_get'].customContextMenu
    };
  }
  else if (customBlocks[i].type === "variables_declare") {
    Blockly.Blocks[customBlocks[i].type] = {
      init: function () {
        var PROPERTIES =
          [['long', 'long'],
          ['float', 'float'],
          ['byte', 'byte'],
          ['unsigned int', 'unsigned int'],
          ['int', 'int'],
          ['char', 'char'],
          ['char pointer', 'char*'],
          ['string (char array)', 'stringa'],
          ['string', 'String']];
        this.setColour("300");
        this.appendDummyInput('VALUE1', null)
          .appendField("Declare")
          .appendField(new Blockly.FieldVariable(
            "item"), 'VAR');
        this.appendDummyInput()
          .appendField("type");
        var dropdown = new Blockly.FieldDropdown(PROPERTIES, function (option) {
          var divisorInput = (option === 'stringa');
          this.sourceBlock_.updateShape_(divisorInput);
        });
        this.appendDummyInput()
          .appendField(dropdown, 'PROPERTY');
        this.appendValueInput('VALUE', null)
          .appendField("Value");
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
      },

      getVars: function () {
        return [this.getFieldValue('VAR')];
      },
      renameVar: function (oldName, newName) {
        if (Blockly.Names.equals(oldName, this.getFieldValue('VAR'))) {
          this.setTitleValue(newName, 'VAR');
        }
      },
      /**
       * Create XML to represent whether the 'divisorInput' should be present.
       * @return {Element} XML storage element.
       * @this Blockly.Block
       */
      mutationToDom: function () {
        var container = document.createElement('mutation');
        var divisorInput = (this.getFieldValue('PROPERTY') === 'CHARTAB');
        container.setAttribute('divisor_input', divisorInput);
        return container;
      },
      /**
       * Parse XML to restore the 'divisorInput'.
       * @param {!Element} xmlElement XML storage element.
       * @this Blockly.Block
       */
      domToMutation: function (xmlElement) {
        var divisorInput = (xmlElement.getAttribute('divisor_input') === 'true');
        this.updateShape_(divisorInput);
      },
      /**
       * Modify this block to have (or not have) an input for 'is divisible by'.
       * @param {boolean} divisorInput True if this block has a divisor input.
       * @private
       * @this Blockly.Block
       */
      updateShape_: function (divisorInput) {
        // Add or remove a Value Input.
        var inputExists = this.getInput('DIVISOR');
        if (divisorInput) {
          if (!inputExists) {
            this.appendValueInput('DIVISOR')
              .appendField("Array size")
              .setCheck('Number');
          }
        } else if (inputExists) {
          this.removeInput('DIVISOR');
        }
      }
    };
  }
  else {
    Blockly.Blocks[customBlocks[i].type] = {
      init: function () {
        this.jsonInit(customBlocks[i]);
      }
    };
  }
}


