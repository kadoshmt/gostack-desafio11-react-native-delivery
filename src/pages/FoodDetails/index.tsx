import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useLayoutEffect,
} from 'react';
import { Image, Alert, AsyncStorage } from 'react-native';

import Icon from 'react-native-vector-icons/Feather';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import formatValue from '../../utils/formatValue';

import api from '../../services/api';

import {
  Container,
  Header,
  ScrollContainer,
  FoodsContainer,
  Food,
  FoodImageContainer,
  FoodContent,
  FoodTitle,
  FoodDescription,
  FoodPricing,
  AdditionalsContainer,
  Title,
  TotalContainer,
  AdittionalItem,
  AdittionalItemText,
  AdittionalQuantity,
  PriceButtonContainer,
  TotalPrice,
  QuantityContainer,
  FinishOrderButton,
  ButtonText,
  IconContainer,
} from './styles';

interface Params {
  id: number;
}

interface Extra {
  id: number;
  name: string;
  value: number;
  quantity: number;
}

interface Food {
  id: number;
  name: string;
  description: string;
  category: string;
  price: number;
  image_url: string;
  thumbnail_url?: string;
  formattedPrice: string;
  extras: Extra[];
}

const FoodDetails: React.FC = () => {
  const [food, setFood] = useState({} as Food);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [foodQuantity, setFoodQuantity] = useState(1);

  const navigation = useNavigation();
  const route = useRoute();

  const routeParams = route.params as Params;

  useEffect(() => {
    async function loadFood(): Promise<void> {
      const result = await api.get(`/foods/${routeParams.id}`);
      const selectedFood = result.data;

      const foodExtras = selectedFood.extras.map((extra: Extra) => {
        return {
          id: extra.id,
          name: extra.name,
          value: extra.value,
          quantity: 0,
        };
      });

      selectedFood.formattedPrice = formatValue(selectedFood.price);

      setFood(selectedFood);
      setExtras(foodExtras);

      const favorite = await api.get(`/favorites/${selectedFood.id}`);
      if (favorite) setIsFavorite(true);
    }

    loadFood();
  }, [routeParams]);

  function handleIncrementExtra(id: number): void {
    const index = extras.findIndex(extra => extra.id === id);
    const newExtras = [...extras];
    if (newExtras[index].quantity < 5) {
      newExtras[index].quantity += 1;
    }
    setExtras(newExtras);
  }

  function handleDecrementExtra(id: number): void {
    const index = extras.findIndex(extra => extra.id === id);
    const newExtras = [...extras];
    if (newExtras[index].quantity > 0) {
      newExtras[index].quantity -= 1;
    }
    setExtras(newExtras);
  }

  function handleIncrementFood(): void {
    if (foodQuantity < 10) setFoodQuantity(foodQuantity + 1);
  }

  function handleDecrementFood(): void {
    if (foodQuantity > 1) setFoodQuantity(foodQuantity - 1);
  }

  const toggleFavorite = useCallback(async () => {
    // const result = await api.get(`/favorites/${food.id}`);

    if (!isFavorite) {
      await api.post('/favorites', {
        id: food.id,
        name: food.name,
        description: food.description,
        price: food.price,
        category: food.category,
        image_url: food.image_url,
        thumbnail_url: food.thumbnail_url,
      });
    } else {
      await api.delete(`/favorites/${food.id}`);
    }
    setIsFavorite(!isFavorite);

    // if (isFavorite) {
    //   const findFood = await;
    //   newStorage.push(findFood);
    // } else {
    //   storageFoods.push(food);
    //   newStorage = [...storageFoods];
    // }

    // await AsyncStorage.setItem(
    //   '@GoRestaurant:favorites',
    //   JSON.stringify(newStorage),
    // );

    // setIsFavorite(!isFavorite);

    // await AsyncStorage.setItem('@GoRestaurant:favorites', JSON.stringify(food));
  }, [isFavorite, food]);

  const cartTotal = useMemo(() => {
    const totalExtras = extras.reduce((acc, extra) => {
      return acc + extra.value * extra.quantity;
    }, 0);
    return formatValue(totalExtras + food.price * foodQuantity);
  }, [extras, food, foodQuantity]);

  async function handleFinishOrder(): Promise<void> {
    try {
      await api.post('orders', {
        product_id: food.id,
        name: food.name,
        description: food.description,
        price: food.price,
        category: food.category,
        thumbnail_url: food.image_url,
        extras,
      });

      navigation.navigate('Orders');
    } catch (error) {
      Alert.alert(
        'Erro ao finalizar o pedido',
        'Houve um erro ao finalizar o seu pedido. Tente novamente.',
      );
    }

    // const forLoop = async _ => {
    //   for (let i = 1; i <= foodQuantity; i += i) {
    //     const result = await api.post('orders', {
    //       product_id: food.id,
    //       name: food.name,
    //       description: food.description,
    //       price: food.price,
    //       category: food.category,
    //       thumbnail_url: food.image_url,
    //       extras: food.extras,
    //     });
    //   }
    // };
  }

  // Calculate the correct icon name
  const favoriteIconName = useMemo(
    () => (isFavorite ? 'favorite' : 'favorite-border'),
    [isFavorite],
  );

  useLayoutEffect(() => {
    // Add the favorite icon on the right of the header bar
    navigation.setOptions({
      headerRight: () => (
        <MaterialIcon
          name={favoriteIconName}
          size={24}
          color="#FFB84D"
          onPress={() => toggleFavorite()}
        />
      ),
    });
  }, [navigation, favoriteIconName, toggleFavorite]);

  return (
    <Container>
      <Header />

      <ScrollContainer>
        <FoodsContainer>
          <Food>
            <FoodImageContainer>
              <Image
                style={{ width: 327, height: 183 }}
                source={{
                  uri: food.image_url,
                }}
              />
            </FoodImageContainer>
            <FoodContent>
              <FoodTitle>{food.name}</FoodTitle>
              <FoodDescription>{food.description}</FoodDescription>
              <FoodPricing>{food.formattedPrice}</FoodPricing>
            </FoodContent>
          </Food>
        </FoodsContainer>
        <AdditionalsContainer>
          <Title>Adicionais</Title>
          {extras.map(extra => (
            <AdittionalItem key={extra.id}>
              <AdittionalItemText>{extra.name}</AdittionalItemText>
              <AdittionalQuantity>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="minus"
                  onPress={() => handleDecrementExtra(extra.id)}
                  testID={`decrement-extra-${extra.id}`}
                />
                <AdittionalItemText testID={`extra-quantity-${extra.id}`}>
                  {extra.quantity}
                </AdittionalItemText>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="plus"
                  onPress={() => handleIncrementExtra(extra.id)}
                  testID={`increment-extra-${extra.id}`}
                />
              </AdittionalQuantity>
            </AdittionalItem>
          ))}
        </AdditionalsContainer>
        <TotalContainer>
          <Title>Total do pedido</Title>
          <PriceButtonContainer>
            <TotalPrice testID="cart-total">{cartTotal}</TotalPrice>
            <QuantityContainer>
              <Icon
                size={15}
                color="#6C6C80"
                name="minus"
                onPress={handleDecrementFood}
                testID="decrement-food"
              />
              <AdittionalItemText testID="food-quantity">
                {foodQuantity}
              </AdittionalItemText>
              <Icon
                size={15}
                color="#6C6C80"
                name="plus"
                onPress={handleIncrementFood}
                testID="increment-food"
              />
            </QuantityContainer>
          </PriceButtonContainer>

          <FinishOrderButton onPress={() => handleFinishOrder()}>
            <ButtonText>Confirmar pedido</ButtonText>
            <IconContainer>
              <Icon name="check-square" size={24} color="#fff" />
            </IconContainer>
          </FinishOrderButton>
        </TotalContainer>
      </ScrollContainer>
    </Container>
  );
};

export default FoodDetails;
