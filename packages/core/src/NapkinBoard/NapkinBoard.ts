import { RxCollection, MangoQuery } from "rxdb";
import { Whiteboard, type WhiteboardConfig } from "../Whiteboard/index.js";
import { CardDocument } from "@boardeditor/model";
import { Container, FederatedEvent } from "pixi.js";
import { Card } from "../Card/index.js";

export class NapkinBoard extends Whiteboard {
  private readonly cardsCollection: RxCollection<CardDocument>;

  constructor(
    cardsCollection: RxCollection<CardDocument>,
    whiteboardConfig: WhiteboardConfig
  ) {
    super(whiteboardConfig);
    this.cardsCollection = cardsCollection;
  }

  protected override initializeManagers(): void {
    super.initializeManagers();
    this.whiteManager.setOnDoubleTapCallback(this.handleDoubleTap.bind(this));
  }

  private async createCard(event: FederatedEvent): Promise<Card> {
    const cardData = await this.cardsCollection.insert({
      id: `id-${Date.now()}`,
      text: "Untitled",
      created_time: new Date().toISOString(),
      last_edited_time: new Date().toISOString(),
    });

    const card = new Card(this, cardData.text, {
      rxDocument: cardData,
    });

    const localPosition = this.mainContainer.toLocal((event as any).global);
    card.position.set(localPosition.x, localPosition.y);

    return card;
  }

  /**
   *
   * @param card 要添加的卡片
   */
  public addCard(card: Card): void {
    this.mainContainer.addChild(card);
  }

  public addCards(cards: Card[]): void {
    cards.forEach((card) => this.addCard(card));
  }

  /**
   *
   * @param fn 回调函数，参数为当前画布上的所有卡片数组
   */
  public layout(fn: (cards: Container[]) => void) {
    fn(this.cards);
  }

  /**
   * ### 搜索功能
   *
   * 实现发现（Discover）的搜索功能
   *
   * @param queryObj 搜索条件
   */
  public async search(queryObj: MangoQuery<CardDocument>) {
    const cardDocuments = await this.cardsCollection.find(queryObj).exec();

    let cards = cardDocuments.map(
      (item) =>
        new Card(this, item.text, {
          rxDocument: item,
        })
    );

    this.addCards(cards);
  }

  get cards() {
    return this.mainContainer.children as Card[];
  }

  private async handleDoubleTap(event: FederatedEvent): Promise<void> {
    if (event.target !== this.app.stage) return; // 只处理画布上的双击事件

    const card = await this.createCard(event);
    this.addCard(card);
  }
}
