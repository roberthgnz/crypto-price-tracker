import * as vscode from 'vscode';
import { CryptoTreeDataProvider } from './cryptoTreeDataProvider';

export function activate(context: vscode.ExtensionContext) {
  const cryptoTreeDataProvider = new CryptoTreeDataProvider();
  
  vscode.window.registerTreeDataProvider('cryptoPriceTracker', cryptoTreeDataProvider);

  let getPricesCommand = vscode.commands.registerCommand('cryptoPriceTracker.getPrices', async () => {
    await cryptoTreeDataProvider.fetchCryptoPrices();
  });

  let updateConfigCommand = vscode.commands.registerCommand('cryptoPriceTracker.updateConfig', async () => {
    const cryptoInput = await vscode.window.showInputBox({
      prompt: 'Enter cryptocurrencies separated by comma (e.g. bitcoin,ethereum)',
      placeHolder: 'bitcoin,ethereum,cardano'
    });

    if (cryptoInput) {
      const cryptos = cryptoInput.split(',').map(crypto => crypto.trim().toLowerCase());
      await vscode.workspace.getConfiguration().update(
        'cryptoPriceTracker.defaultCryptos', 
        cryptos, 
        vscode.ConfigurationTarget.Global
      );
      
      await cryptoTreeDataProvider.fetchCryptoPrices();
      vscode.window.showInformationMessage('Updated cryptocurrency configuration');
    }
  });

  cryptoTreeDataProvider.fetchCryptoPrices();

  context.subscriptions.push(getPricesCommand, updateConfigCommand);
}

export function deactivate() {}