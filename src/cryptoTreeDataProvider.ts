import * as vscode from 'vscode';
import axios from 'axios';

interface CryptoCurrency {
  id: string;
  symbol: string;
  current_price: number;
  price_change_percentage_24h: number;
}

export class CryptoTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly price: string,
    public readonly change: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState);
    
    this.description = `${price} - 24h: ${change}%`;
    
    const numChange = parseFloat(change);
    this.iconPath = numChange >= 0 
      ? new vscode.ThemeIcon('arrow-up', new vscode.ThemeColor('charts.green')) 
      : new vscode.ThemeIcon('arrow-down', new vscode.ThemeColor('charts.red'));
  }
}

export class CryptoTreeDataProvider implements vscode.TreeDataProvider<CryptoTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<CryptoTreeItem | undefined | null | void> = new vscode.EventEmitter<CryptoTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<CryptoTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

  private cryptoData: CryptoTreeItem[] = [];

  async fetchCryptoPrices() {
    try {
      const configuration = vscode.workspace.getConfiguration('cryptoPriceTracker');
      const cryptos = configuration.get<string[]>('defaultCryptos', ['bitcoin', 'ethereum', 'cardano', 'dogecoin']);
      const currency = configuration.get<string>('currency', 'usd');

      const response = await axios.get<CryptoCurrency[]>('https://api.coingecko.com/api/v3/coins/markets', {
        params: {
          vs_currency: currency,
          ids: cryptos.join(','),
          order: 'market_cap_desc',
          per_page: 100,
          page: 1,
          sparkline: false
        }
      });

      this.cryptoData = response.data.map(crypto => 
        new CryptoTreeItem(
          crypto.id.toUpperCase(), 
          `$${crypto.current_price}`, 
          `${crypto.price_change_percentage_24h}`,
          vscode.TreeItemCollapsibleState.None
        )
      );

      this._onDidChangeTreeData.fire();
    } catch (error) {
      vscode.window.showErrorMessage('Error in obtaining cryptocurrency prices');
      this.cryptoData = [];
    }
  }

  getTreeItem(element: CryptoTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(): Thenable<CryptoTreeItem[]> {
    return Promise.resolve(this.cryptoData);
  }
}
