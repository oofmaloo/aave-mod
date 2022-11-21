from web3 import Web3
w3 = Web3(Web3.HTTPProvider('http://127.0.0.1:8545'))

import time
from itertools import product, combinations
import ast

import json

with open("../artifacts/contracts/interfaces/IRouter.sol/IRouter.json") as f:
    router_json = json.load(f)
router_abi = router_json["abi"]

with open("../artifacts/contracts/interfaces/IAggregator.sol/IAggregator.json") as f:
    aggregator_json = json.load(f)
aggregator_abi = aggregator_json["abi"]


ray = 1e27
# pool_data_provider = Contract.objects.get(name="PoolDataProvider")
# pool_data_provider_address = pool_data_provider.address
# pool_data_provider_abi = pool_data_provider.abi
# _pool_data_provider = w3.eth.contract(address=pool_data_provider_address, abi=pool_data_provider_abi)

current_allocation = []
routers = []

underlying_asset_address = "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707"
# avas_token_address = ""
aggregator_address = "0x6a90D73D17bf8d3DD5f5924fc0d5D9e8af23042d"


current_lowest_rate = 100
# total amount in aggregator
current_total_amount = 0 
# total amount being returned annually (current_total_amount*weighted_interest_rate)
current_return = 0 
# weighted interest rate
current_rate = 0 
# how many steps to compile per token
# eg steps is percentage of 100
# 1 step is 1% of current_total_amount per allocation
steps = 1

# current_allocation = [
# 	{
# 		"protocol_id": 0,
# 		"underlying_address": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
# 		"interest_rate": .08,
# 		"balance": 1000000,
# 		"token_address": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
# 	},
# 	{
# 		"protocol_id": 1,
# 		"underlying_address": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
# 		"interest_rate": .01,
# 		"balance": 9000000,
# 		"token_address": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
# 	},
# ]

# tokens = [
# 	{
# 		"protocol_id": 0,
# 		"underlying_address": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
# 		"interest_rate": .08,
# 		"liquidity": 1000000000,
# 		"token_address": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
# 	},
# 	{
# 		"protocol_id": 1,
# 		"underlying_address": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
# 		"interest_rate": .12,
# 		"liquidity": 1000000000,
# 		"token_address": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
# 	},
# 	{
# 		"protocol_id": 2,
# 		"underlying_address": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
# 		"interest_rate": .912,
# 		"liquidity": 1000000000,
# 		"token_address": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
# 	},
# 	{
# 		"protocol_id": 3,
# 		"underlying_address": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
# 		"interest_rate": .112,
# 		"liquidity": 1000000000,
# 		"token_address": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
# 	},
# ]

# allocations = []

def current_rate_and_return(_current_allocation):
	# global current_total_amount
	# global current_return
	# global current_rate
	# global current_lowest_rate

	for allocation in _current_allocation:
		# current_total_amount += allocation['balance']
		# print("current_total_amount", current_total_amount)
		print("allocation['interest_rate']", allocation['interest_rate'])
		print("allocation['balance']", allocation['balance'])
		current_return += allocation['interest_rate'] * allocation['balance']
		if (allocation['interest_rate'] < current_lowest_rate):
			current_lowest_rate = allocation['interest_rate']

	current_rate = current_return / current_total_amount

	# return (current_rate, current_return)

# v2
token_allocation_steps = []

def compile_tokens_steps():
	# current_rate, current_return = current_rate_and_return(current_allocation)

	for router in routers:
		liquidity = 10000000000000
		# liquidity = get_liquidity(router.token_address)

		for step in range(steps, 101, steps):
			allocation_percentage = step / 100
			# print(allocation_percentage)
			amount = current_total_amount * allocation_percentage
			# print(amount)
			interest_rate = router['interest_rate']
			# print(interest_rate)
			# interest_rate = get_interest_rate(router.token_address, amount)
			annual_return = amount * interest_rate
			# print(annual_return)

			if amount <= liquidity:
				token_allocation_steps.append({
					"protocol_id": router['protocol_id'],
					"underlying_address": router['underlying_address'],
					"token_address": router['token_address'],
					"interest_rate": interest_rate,
					"annual_return": annual_return,
					"current_total_amount": current_total_amount,
					"amount": amount,
					"allocation_percentage": allocation_percentage
				})


def check_duplicate(l):
    visited = set()
    has_duplicate = False
    for element in l:
        if element in visited:
            pass
        elif l.count(element) == 1:
            visited.add(element)
        elif l.count(element) > 1:
            has_duplicate = True
            # print("The list contains duplicate elements.")
            break
    if not has_duplicate:
    	return has_duplicate
        # print("List has no duplicate elements.")

    return has_duplicate

total_count = 0
results_count = 0

token_allocation_combinations_results = []

def get_all_combinations():
	global total_count
	global results_count
	# print("len(routers) is: ", len(routers))
	for x in range(1, len(routers)+1):
		print("x is: ", x)
		for combo_list in combinations(token_allocation_steps, r=x):
			total_count += 1
			combo_list = list(combo_list)
			# print("combo_list", combo_list)

			if len(combo_list) == 1:
				for allo in combo_list:
					if allo['allocation_percentage'] != 1.0:
						continue

			protocol_id_list = []

			for allo in combo_list:
				protocol_id_list.append(allo['protocol_id'])


			if len(protocol_id_list) > 1:
				if check_duplicate(protocol_id_list):
					continue

			
			allocation_percentage = 0

			for allo in combo_list:
				allocation_percentage += allo['allocation_percentage']


			if allocation_percentage != 1.0:
				continue

			results_count += 1

			# print("Key one is: ", *combo_list)


			token_allocation_combinations_results.append(combo_list)


def run():
	start = time.time()
	# get current allocation data
	# current_rate, current_return = current_rate_and_return(current_allocation)
	# print("current_rate, current_return", current_rate, current_return)

	# compile platforms and steps
	compile_tokens_steps()
	# print("token_allocation_steps", token_allocation_steps)
	# run each combination
	# 	if allocation beats current allocation
	get_all_combinations()

	# print(get_all_combinations())

	# sort by best annual return, or APR, && count of distributions ascending
	#	the goal is to redistribute into the highest annual return with the least aggregations
	# print(" \n token_allocation_combinations_results", token_allocation_combinations_results)
	# print(" \n token_allocation_combinations_results", type(token_allocation_combinations_results))

	# for result in token_allocation_combinations_results:
		# print(" \n result", result)
		# for i in result:
		# 	print(" \n i", i)
		# break

	# token_allocation_sorted = sorted(token_allocation_combinations_results, key=lambda x: (sum(i['annual_return'] for i in x), len), reverse=False)
	token_allocation_sorted = sorted(token_allocation_combinations_results, key=lambda x: (sum(i['annual_return'] for i in x)), reverse=False)
	# print(" \n token_allocation_sorted", token_allocation_sorted)

	# params

	# address asset
	# address[] routers
	# uint256[] ladderPercentages
	# address caller

	routers = []
	allocation_percentage = []
	n_allocation_percentage = [] # number version for printing result
	n_annual_return = [] # number version for printing result
	apr = 0

	best_result = []
	for result in token_allocation_sorted:
		best_result = result
		result_count = 0
		for r in result:
			result_count+=1
			# tx params
			routers.append(r['protocol_id'])
			allocation_percentage.append(str(int(r['allocation_percentage'] * (10**4))))
			n_allocation_percentage.append((int(r['allocation_percentage'] * (10**4))))
			n_annual_return.append((int(r['annual_return'])))
			# print variables
		print("result_count", result_count)
		print("current_total_amount", current_total_amount)
		apr = sum(n_annual_return) / current_total_amount
		print("apr", apr)
		break
	print(" \n best_result", best_result)
	print(" \n best_result", type(best_result))


	print(" \n apr", apr)
	print(" \n current_rate", current_rate)
	dif = (apr*100) - (current_rate*100)
	print(" \n dif", str(int(float(dif))))
	print(" \n dif", dif)

	print(" \n asset", underlying_asset_address)
	print(" \n routers", routers)
	print(" \n ladderPercentages", allocation_percentage)

	executionTime = (time.time() - start)
	print('Algorithm took: ' + str(executionTime), "seconds", "and found", results_count, "better allocations")

	print("Best result: \n ")
	print("APR +/-: ", (apr*100) - (current_rate*100))
	print("Income Difference % +/-: ", ((apr*100) - (current_rate*100))/(current_rate*100)*100, "%")
	print("Yrly Yield: ", apr*100,"%")

def init():
	global current_total_amount
	global current_rate
	global current_return

	_aggregator = w3.eth.contract(address=aggregator_address, abi=aggregator_abi)

	aggregated_balance = _aggregator.caller.getBalance()

	current_total_amount = aggregated_balance/(10**6) # 6 for usdc

	aggregator_data = _aggregator.caller.getRouterWeightedInterestRate()

	current_rate = aggregator_data[1]/ray

	current_return = current_total_amount * current_rate

	routers_list = _aggregator.caller.getRoutersDataList()


	# for router in routers:
	for count, router in enumerate(routers_list):
		_router = w3.eth.contract(address=router, abi=router_abi)
		token_address = _router.caller.depositToken(underlying_asset_address)

		balance = _router.caller.getBalance(underlying_asset_address, _aggregator.address)/(10**6)

		interest_rate = _router.caller.getPreviousInterestRate(underlying_asset_address)/ray

		liquidity = _router.caller.getLiquidity(underlying_asset_address)/(10**6)


		if (balance > 0):
			current_allocation.append({
				"protocol_id": count,
				"underlying_address": underlying_asset_address,
				"interest_rate": interest_rate,
				"balance": balance,
				"token_address": token_address
			})

		routers.append({
			"protocol_id": count,
			"underlying_address": underlying_asset_address,
			"interest_rate": interest_rate,
			"liquidity": liquidity,
			"token_address": token_address
		})

		run()


init()