import React, { useEffect, useState } from "react";

import RandomCard from "../RandomCard";
import { Container } from "./styles";

import useWindowSize from "../../utils/windowSize";

import axios from "axios";

const CardContainer: React.FC = () => {
	const [cards, setCards] = useState<Card[] | []>([]);
	const [width, height] = useWindowSize();
	const [grid, setGrid] = useState<Grid>({
		column: 4,
		row: 3,
	});

	const getList = React.useCallback(
		async (page: number) => {
			let data: Image[] = [];
			await axios
				.get(
					`https://picsum.photos/v2/list?page=${page}&limit=${
						grid.column * grid.row
					}`
				)
				.then((response) => {
					data = response.data;
				})
				.catch((err) => {
					console.error(err);
					return getList(page - 10);
				});
			return data;
		},
		[grid.column, grid.row]
	);

	const getRandom = React.useCallback(
		async (width: number, height: number) => {
			let data;
			await axios
				.get(
					`https://picsum.photos/${Number(width).toFixed()}/${Number(
						height
					).toFixed()}`,
					{ responseType: "arraybuffer" }
				)
				.then((response) => {
					let image = btoa(
						new Uint8Array(response.data).reduce(
							(data, byte) => data + String.fromCharCode(byte),
							""
						)
					);
					data = `data:${response.headers[
						"content-type"
					].toLowerCase()};base64,${image}`;
				});
			return data;
		},
		[]
	);

	const createCard = React.useCallback(async () => {
		const cardWidth = width / grid.column - 60;
		const cardHeight = height / grid.row - 60;
		let src;
		if (cardWidth > 0 || cardHeight > 0) {
			await getRandom(cardWidth, cardHeight).then((value) => {
				src = value;
			});
		}

		let card: Card = {
			size: { w: cardWidth, h: cardHeight },
			src: src,
		};

		return card;
	}, [width, grid.column, grid.row, height, getRandom]);

	const createList = React.useCallback(async () => {
		const cardWidth = (await (width / grid.column)) - 60;
		const cardHeight = (await (height / grid.row)) - 60;

		const list = await getList(
			Number(Math.floor(Math.random() * 100).toFixed())
		);

		const cardList: Card[] = [];

		list.forEach((el: Image) => {
			const card: Card = {
				size: { w: cardWidth, h: cardHeight },
				src: el.download_url,
			};
			cardList.push(card);
		});

		return cardList;
	}, [getList, grid.column, grid.row, height, width]);

	const generateCardList = React.useCallback(async () => {
		const list = await createList();
		if (list && list.length > 0) {
			setCards(list);
		}
	}, [createList]);

	const generateRandomCard = React.useCallback(async () => {
		const index = Math.floor(Math.random() * (grid.column * grid.row) - 1);
		if (index >= 0 && index <= 11) {
			const card: Card = await createCard();
			if (card && typeof card.src !== "undefined" && card.src) {
				setCards((cards) => {
					return [
						...cards.slice(0, index),
						card,
						...cards.slice(index, cards.length - 1),
					];
				});
			}
		}
	}, [grid.column, grid.row, createCard]);

	useEffect(() => {
		generateCardList().then(() => {});
		setInterval(() => {
			generateRandomCard();
		}, 1200);
		// Não sei pq mas ele n aceita 2ms :)

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<Container
			style={{ gridTemplateColumns: `repeat(${grid.column}, 1fr)` }}
		>
			{cards.map((card: Card | any, key: number) => {
				return <RandomCard key={key} src={card.src} size={card.size} />;
			})}
		</Container>
	);
};

interface Card {
	size: Size;
	src: any;
}

interface Grid {
	column: number;
	row: number;
}

interface Size {
	w: number;
	h: number;
}

interface Image {
	id: number;
	width: number;
	heigh: number;
	download_url: string;
}

export default CardContainer;
