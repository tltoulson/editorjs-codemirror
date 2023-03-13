# CodeMirror Tool for EditorJS

CodeMirror tool for EditorJS allows adding Code blocks with syntax highlighing to the EditorJS content. This block uses CodeMirror 6 for the editor and exposes a language selector for choosing the languages supported by CodeMirror's base packages.

## Usage

Add a new Tool to the tools property of the Editor.js initial config.

```js
var editor = EditorJS({
  ...
  
  tools: {
    ...
    codemirror: CodeMirrorTool,
  }
  
  ...
});
```

## Output data

This Tool returns code.

```json
{
    "type" : "codemirror",
    "data" : {
        "code": "body {\n font-size: 14px;\n line-height: 16px;\n}",
        "language": "CSS",
    }
}
```