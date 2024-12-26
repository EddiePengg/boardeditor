import { RxCollection, MangoQuery } from "rxdb";
import { Whiteboard, type WhiteboardConfig } from "../Whiteboard/index";
import { CardDocument } from "@boardeditor/model";
import { Container, FederatedEvent } from "pixi.js";
import { Card } from "../Card/index";
import { nanoid } from "nanoid";
import { ErrorModal } from "../components/ErrorModal";

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
    this.whiteManager.setDoubleTapHandler(this.handleDoubleTap.bind(this));
  }

  private async createCard(event: FederatedEvent): Promise<Card> {
    const cardData = await this.cardsCollection.insert({
      id: nanoid(),
      text: "Untitled",
      created_time: new Date().toISOString(),
      last_edited_time: new Date().toISOString(),
      in_trash: false,
    });

    const card = new Card(this, cardData);

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
    try {
      this.clear();

      const cardDocuments = await this.cardsCollection.find(queryObj).exec();

      if (!cardDocuments || cardDocuments.length === 0) {
        console.warn("未找到匹配的卡片");
        ErrorModal.show("未找到匹配的卡片");
        return;
      }

      let cards = cardDocuments.map((item) => new Card(this, item, {}));
      this.addCards(cards);
    } catch (error) {
      console.error("搜索卡片时发生错误:", error);
      ErrorModal.show(
        `搜索失败: ${error instanceof Error ? error.message : "未知错误"}`
      );
    }
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
