import * as cp from 'child_process';
import * as path from 'path';
import * as utils from './elmUtils';
import * as vscode from 'vscode';

import { isWindows } from './elmUtils';
let reactor = {} as utils.ExecutingCmd;

// let reactor: cp.ChildProcess;
let oc: vscode.OutputChannel;
let statusBarStopButton: vscode.StatusBarItem;

function getReactorAndArguments(host: string, port: string, subdir: string): [string, string, string[]] {
  const config: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration('elm');
  const dummyPath = path.join(vscode.workspace.rootPath, 'dummyfile');
  const reactor018Command: string = 'elm-reactor';
  const compiler: string = <string>config.get('compiler');
  const [cwd, elmVersion] = utils.detectProjectRootAndElmVersion(dummyPath, vscode.workspace.rootPath);
  const args018 = ['-a=' + host, 'p=' + port];
  const args019 = ['reactor', '--port=' + port];
  const cwdWithSubdir = path.join(cwd, subdir);
  const args = utils.isElm019(elmVersion) ? args019 : args018;
  const reactorCommand = utils.isElm019(elmVersion) ? compiler : reactor018Command;

  return [cwdWithSubdir, reactorCommand, args];
}

function startReactor(): Promise<() => void> {
  if (reactor.isRunning) {
    return Promise.resolve(reactor.stdin.write.bind(reactor.stdin));
  } else {
    try {
      return new Promise(resolve => {
        oc = vscode.window.createOutputChannel('Elm Reactor');
        const config: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration(
          'elm',
        );
        const host: string = <string>config.get('reactorHost');
        const port: string = <string>config.get('reactorPort');
        const subdir: string = <string>config.get('reactorSubdir');
        const [cwd, reactorCommand, args] = getReactorAndArguments(host, port, subdir);
        reactor = utils.execCmd(reactorCommand, {
          cmdArguments: args,
          showMessageOnError: true,
          onStart: () => {
            resolve(reactor.stdin.write.bind(reactor.stdin));
            oc.appendLine('starting reactor');
          },

          onStdout: data => {
            if (data && data.toString().startsWith('| ') === false) {
              oc.append(data.toString());
            }
          },

          onStderr: data => { if (data) { oc.append(data); } },

          notFoundText: 'Install Elm from http://elm-lang.org/.',
        });

        oc.show(vscode.ViewColumn.Three);
        statusBarStopButton.show();
      });
    } catch (e) {
      console.error('Starting Elm reactor failed', e);
      vscode.window.showErrorMessage('Starting Elm reactor failed');
    }
  }
}

function stopReactor() {
  if (reactor.isRunning) {
    reactor.kill();
    oc.clear();
    oc.dispose();
    statusBarStopButton.hide();
    vscode.window.showInformationMessage('Elm Reactor stopped.');
  } else {
    vscode.window.showErrorMessage(
      'Cannot stop Elm Reactor. The Reactor is not running.',
    );
  }
}


export function activateReactor(): vscode.Disposable[] {
  statusBarStopButton = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
  );
  statusBarStopButton.text = '$(primitive-square)';
  statusBarStopButton.command = 'elm.reactorStop';
  statusBarStopButton.tooltip = 'Stop reactor';
  return [
    vscode.commands.registerCommand('elm.reactorStart', () => startReactor()),
    vscode.commands.registerCommand('elm.reactorStop', () => stopReactor(),
    ),
  ];
}

export function deactivateReactor(): void {
  stopReactor();
}
